const express = require('express');
const router = express.Router();
const { Book, Author, Review, SaleByYear } = require('../models');

// Top 10 Rated Books
router.get('/top-10-rated', async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [{ model: Review }]
    });

    const processedBooks = books.map(book => {
      if (!book.Reviews || book.Reviews.length === 0) {
        return null; 
      }

      let totalScore = 0;
      let highest = book.Reviews[0];
      let lowest = book.Reviews[0];

      book.Reviews.forEach(r => {
        totalScore += r.score;
        if (r.score > highest.score) highest = r;
        if (r.score < lowest.score) lowest = r;
      });

      return {
        id: book.id,
        name: book.name,
        avg_score: totalScore / book.Reviews.length,
        highest_review: highest.review,
        lowest_review: lowest.review
      };
    }).filter(b => b !== null);

    processedBooks.sort((a, b) => b.avg_score - a.avg_score);
    
    res.json(processedBooks.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top 50 Selling Books
router.get('/top-50-selling', async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: SaleByYear, attributes: ['sales'] }, 
        {
          model: Author,
          include: [
            { 
              model: Book, 
              include: [{ model: SaleByYear, attributes: ['sales'] }] 
            }
          ]
        }
      ]
    });

    const booksWithSales = books.map(book => {
      let bookSales = 0;
      const salesArray = book.SaleByYears || book.sale_by_years || book.SalesByYears || [];
      salesArray.forEach(s => bookSales += (s.sales || 0));

      let authorSales = 0;
      if (book.Author && book.Author.Books) {
        book.Author.Books.forEach(ab => {
          const abSalesArray = ab.SaleByYears || ab.sale_by_years || ab.SalesByYears || [];
          abSalesArray.forEach(s => authorSales += (s.sales || 0));
        });
      }

      const pubYear = new Date(book.date_of_publish).getFullYear();

      return {
        id: book.id,
        name: book.name,
        book_sales: bookSales,
        author_sales: authorSales,
        pub_year: pubYear
      };
    });

    const booksByYear = {};
    booksWithSales.forEach(b => {
      if (!booksByYear[b.pub_year]) booksByYear[b.pub_year] = [];
      booksByYear[b.pub_year].push(b);
    });

    const top5IdsPerYear = new Set();
    Object.values(booksByYear).forEach(yearGroup => {
      yearGroup.sort((a, b) => b.book_sales - a.book_sales);
      yearGroup.slice(0, 5).forEach(b => top5IdsPerYear.add(b.id));
    });

    booksWithSales.forEach(b => {
      b.top_5_year = top5IdsPerYear.has(b.id);
    });

    
    booksWithSales.sort((a, b) => b.book_sales - a.book_sales);

    res.json(booksWithSales.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;