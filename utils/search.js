const { Client } = require('@elastic/elasticsearch');

const useSearch = process.env.USE_SEARCH === 'true';

const syncAllBooksToSearch = async () => {
  if (!useSearch || !client) return;

  const { Book, Review } = require('../models');
  const books = await Book.findAll();

  for (const book of books) {
    const reviews = await Review.findAll({
      where: { book_id: book.id }
    });
    await syncBookToSearch(book, reviews);
  }
};

let client = null;
if (useSearch) {
  client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
  });

  client.ping()
    .then(() => console.log('Elasticsearch connected'))
    .catch(err => console.error('Failed to connect to Elasticsearch', err));
}

const INDEX_NAME = 'books';

const initIndex = async () => {
  if (!useSearch || !client) return;
  try {
    await client.ping();
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await client.indices.create({ index: INDEX_NAME });
    }
    return true;
  } catch (err) {
    console.error('Error initializing Elasticsearch index', err);
    return false;
  }
};

const initializeSearch = async () => {
  if (!useSearch || !client) return false;

  for (let attempt = 1; attempt <= 10; attempt++) {
    if (await initIndex()) return true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
};

const syncBookToSearch = async (book, reviews = []) => {
  if (!useSearch || !client) return;
  try {
    await client.index({
      index: INDEX_NAME,
      id: book.id.toString(),
      refresh: 'wait_for',
      document: {
        name: book.name,
        summary: book.summary,
        reviews: reviews.map(r => r.review)
      }
    });
  } catch (err) {
    console.error('Error syncing book to search', err);
  }
};

const deleteBookFromSearch = async (bookId) => {
  if (!useSearch || !client) return;
  try {
    await client.delete({
      index: INDEX_NAME,
      id: bookId.toString()
    });
  } catch (err) {
    if (err.meta && err.meta.statusCode !== 404) {
      console.error('Error deleting book from search', err);
    }
  }
};

const searchBooks = async (query, page = 1, perPage = 10) => {
  if (!useSearch || !client) return null;
  try {
    const from = (page - 1) * perPage;
    
    const esQuery = query && query.trim() !== ''
      ? {
          multi_match: {
            query: query.trim(),
            fields: ['reviews^4', 'name^3', 'summary^2']
          }
        }
      : { match_all: {} };

    const result = await client.search({
      index: INDEX_NAME,
      from,
      size: perPage,
      query: esQuery,
      ...(query && query.trim() !== '' ? {
        highlight: {
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          fields: {
            reviews: {
              number_of_fragments: 3,
              fragment_size: 180
            },
            name: {},
            summary: {}
          }
        }
      } : {})
    });

    const total = result.hits.total.value;
    const hits = result.hits.hits.map(hit => ({
      id: parseInt(hit._id),
      score: hit._score,
      ...hit._source,
      matchedReviews: hit.highlight?.reviews || []
    }));

    return { total, hits };
  } catch (err) {
    console.error('Error searching books in ES', err);
    return null;
  }
};

module.exports = {
  useSearch,
  initializeSearch,
  syncBookToSearch,
  syncAllBooksToSearch,
  deleteBookFromSearch,
  searchBooks
};

