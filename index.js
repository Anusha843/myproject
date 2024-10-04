const express = require('express');
const mongoose = require('mongoose');

const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());

// Update the mongoose connection without deprecated options
mongoose.connect('mongodb://localhost:27017/meanstack')
    .then(() => app.listen(5000))
    .then(() => {
        console.log('Connected to database and listening on port 5000');
    })
    .catch(() => {
        console.log('Connection failed');
    });

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String,
    sold: Boolean,
});

const Product = mongoose.model('Product', productSchema);

const seedDatabase = async (req, res) => {
    try {
      const url = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';
      const response = await axios.get(url);
  
      const data = response.data;
      await Product.insertMany(data); 
  
      res.status(200).json({ message: 'Database seeded successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error seeding the database', error });
    }
  };

  app.get('/seed', seedDatabase);

  app.get('/transactions', async (req, res) => {
    const { month, search, page = 1, perPage = 10 } = req.query;
  
    const searchQuery = {};
    const monthIndex = new Date(`${month} 1, 2021`).getMonth();  // Convert month to index
  
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } },
      ];
    }
  
    const dateStart = new Date(2021, monthIndex, 1);
    const dateEnd = new Date(2021, monthIndex + 1, 0);
  
    searchQuery.dateOfSale = { $gte: dateStart, $lte: dateEnd };
  
    try {
      const transactions = await Product.find(searchQuery)
        .skip((page - 1) * perPage)
        .limit(Number(perPage));
  
      const total = await Product.countDocuments(searchQuery);
  
      res.json({ transactions, total, page, perPage });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching transactions', error });
    }
  });
  
  app.get('/statistics', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(`${month} 1, 2021`).getMonth();
    
    const dateStart = new Date(2021, monthIndex, 1);
    const dateEnd = new Date(2021, monthIndex + 1, 0);
  
    try {
      const totalSales = await Product.aggregate([
        { $match: { dateOfSale: { $gte: dateStart, $lte: dateEnd }, sold: true } },
        { $group: { _id: null, totalSaleAmount: { $sum: "$price" } } }
      ]);
  
      const soldItems = await Product.countDocuments({ dateOfSale: { $gte: dateStart, $lte: dateEnd }, sold: true });
      const notSoldItems = await Product.countDocuments({ dateOfSale: { $gte: dateStart, $lte: dateEnd }, sold: false });
  
      res.json({
        totalSaleAmount: totalSales[0]?.totalSaleAmount || 0,
        totalSoldItems: soldItems,
        totalNotSoldItems: notSoldItems,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching statistics', error });
    }
  });

  
  app.get('/barchart', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(`${month} 1, 2021`).getMonth();
    
    const dateStart = new Date(2021, monthIndex, 1);
    const dateEnd = new Date(2021, monthIndex + 1, 0);
  
    try {
      const priceRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-200', min: 101, max: 200 },
        // Add more ranges...
      ];
  
      const data = await Promise.all(
        priceRanges.map(async (range) => {
          const count = await Product.countDocuments({
            dateOfSale: { $gte: dateStart, $lte: dateEnd },
            price: { $gte: range.min, $lte: range.max },
          });
          return { range: range.range, count };
        })
      );
  
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bar chart data', error });
    }
  });

  
  app.get('/piechart', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(`${month} 1, 2021`).getMonth();
  
    const dateStart = new Date(2021, monthIndex, 1);
    const dateEnd = new Date(2021, monthIndex + 1, 0);
  
    try {
      const categoryData = await Product.aggregate([
        { $match: { dateOfSale: { $gte: dateStart, $lte: dateEnd } } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]);
  
      res.json(categoryData);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching pie chart data', error });
    }
  });

  
  app.get('/combined-data', async (req, res) => {
    const { month } = req.query;
  
    try {
      const [statistics, barChart, pieChart] = await Promise.all([
        axios.get(`/statistics?month=${month}`),
        axios.get(`/barchart?month=${month}`),
        axios.get(`/piechart?month=${month}`)
      ]);
  
      res.json({
        statistics: statistics.data,
        barChart: barChart.data,
        pieChart: pieChart.data,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching combined data', error });
    }
  });

app.use("/api", (req, res, next) => {
    res.send("Hi Hello");
});
