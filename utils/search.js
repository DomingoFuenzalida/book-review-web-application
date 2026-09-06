const { Client } = require('@elastic/elasticsearch');

const useSearch = process.env.USE_SEARCH === 'true';

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
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await client.indices.create({ index: INDEX_NAME });
    }
  } catch (err) {
    console.error('Error initializing Elasticsearch index', err);
  }
};

if (useSearch) {
  setTimeout(initIndex, 5000); // Wait for ES to be up
}

const syncBookToSearch = async (book, reviews = []) => {
  if (!useSearch || !client) return;
  try {
    await client.index({
      index: INDEX_NAME,
      id: book.id.toString(),
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
    
    let esQuery = { match_all: {} };
    if (query && query.trim() !== '') {
      esQuery = {
        multi_match: {
          query: query,
          fields: ['name^3', 'summary^2', 'reviews']
        }
      };
    }

    const result = await client.search({
      index: INDEX_NAME,
      from,
      size: perPage,
      query: esQuery
    });

    const total = result.hits.total.value;
    const hits = result.hits.hits.map(hit => ({
      id: parseInt(hit._id),
      score: hit._score,
      ...hit._source
    }));

    return { total, hits };
  } catch (err) {
    console.error('Error searching books in ES', err);
    return null;
  }
};

module.exports = {
  useSearch,
  syncBookToSearch,
  deleteBookFromSearch,
  searchBooks
};

