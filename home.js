import styles from './home.module.css';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart } from '@mui/x-charts/BarChart';

const Home = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetching data from the API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get('YOUR_API_ENDPOINT'); // Replace with your actual API endpoint
                setRows(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculating statistics
    const totalSale = rows.reduce((acc, item) => acc + item.price, 0);
    const totalSoldItems = rows.filter(item => item.sold).length;
    const totalNotSoldItems = rows.length - totalSoldItems;

    // DataGrid columns definition
    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'title', headerName: 'Title', width: 130 },
        { field: 'description', headerName: 'Description', width: 130 },
        { field: 'price', headerName: 'Price', type: 'number', width: 90 },
        { field: 'category', headerName: 'Category', width: 160 },
        { field: 'sold', headerName: 'Sold', type: 'boolean', width: 90 },
        {
            field: 'image',
            headerName: 'Image',
            width: 120,
            renderCell: (params) => (
                <img
                    src={params.value}
                    alt={params.row.title}
                    style={{ width: '100%', height: 'auto' }}
                />
            ),
        },
    ];

    // DataGrid pagination model
    const paginationModel = { page: 0, pageSize: 10 };

    // Handling loading state
    if (loading) {
        return <div>Loading...</div>;
    }

    // Data preparation for the BarChart
    const dataset = rows.map(item => ({
        month: item.dateOfSale.slice(0, 7), // Example: "2021-11"
        seoul: item.sold ? item.price : 0, // Adjust accordingly for your use case
    }));

    // Bar chart settings
    const chartSetting = {
        xAxis: [
            {
                scaleType: 'band',
                label: 'Month',
            },
        ],
        yAxis: [
            {
                scaleType: 'linear',
                label: 'Total Sale Amount',
            },
        ],
        width: 500,
        height: 400,
    };

    return (
        <div className={styles.main}>
            <div className={styles.head}>
                <h1>Transaction Dashboard</h1>
            </div>
            <Paper sx={{ height: 630, width: '100%', backgroundColor: 'gold' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 20]}
                    sortingOrder={['asc', 'desc']}
                    sortingMode="multiple"
                    sx={{ border: 0 }}
                />
            </Paper>
            <div>
                <h1>Statistics - June</h1>
                <div className={styles.statmain}>
                    <div className={styles.stat}>
                        <h2>Total Sale</h2>
                        <h3>{totalSale}</h3>
                    </div>
                    <div className={styles.stat}>
                        <h2>Total Sold Items</h2>
                        <h3>{totalSoldItems}</h3>
                    </div>
                    <div className={styles.stat}>
                        <h2>Total Not Sold Items</h2>
                        <h3>{totalNotSoldItems}</h3>
                    </div>
                </div>
            </div>
            <BarChart
                dataset={dataset}
                yAxis={[{ scaleType: 'linear', dataKey: 'seoul', label: 'Total Sale Amount' }]}
                xAxis={[{ scaleType: 'band', dataKey: 'month', label: 'Month' }]}
                series={[{ dataKey: 'seoul', label: 'Sales Amount' }]}
                layout="vertical"
                {...chartSetting}
            />
        </div>
    );
};

export default Home;
