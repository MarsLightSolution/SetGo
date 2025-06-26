import React from "react";
import { Card, CardContent, Typography, CardMedia } from "@mui/material";
import { Input, TextField, Button } from "@mui/material";
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Footer from "../components/common/Footer";

// Reusable Ad Card Component
const AdCard = ({ image, title, location }) => (
  <Card>
    <CardMedia
      component="img"
      height="140"
      image={image}
      alt={title}
    />
    <CardContent>
      <Typography variant="body1" fontWeight="bold">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{location}</Typography>
    </CardContent>
  </Card>
);

const Home = () => {
  // Simulating fetched data from backend
  const latestAds = [
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
    { image: "https://via.placeholder.com/150", title: "Electrical Engineering", location: "Hamburg" },
  ];

  return (
    <>
      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Main Layout */}
        <Grid container spacing={2} sx={{ px: 4, py: 3 }}>
          {/* Left Column - Categories */}
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Categories</Typography>
              <ul style={{ fontSize: '0.9rem', paddingLeft: '1rem' }}>
                <li>Car, Bike and Boat</li>
                <li>Cars</li>
                <li>Bicycles & Accessories</li>
                <li><strong>Property</strong></li>
                <li>Commercial Real Estate</li>
                <li>Houses for Sale</li>
                <li>Rental Apartments</li>
                <li>More</li>
              </ul>
            </Card>
          </Grid>

          {/* Right Column - Content */}
          <Grid item xs={12} md={9}>
            {/* Hero Banner */}
            <Card sx={{ mb: 2, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6">Join Now</Typography>
            </Card>

            {/* Gallery */}
            <Typography variant="h6" gutterBottom>Gallery</Typography>
            <Grid container spacing={2} mb={4}>
              {[...Array(3)].map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <AdCard image="https://via.placeholder.com/150" title="Original BMW leather" location="Hamburg" />
                </Grid>
              ))}
            </Grid>

            {/* Latest Ads */}
            <Typography variant="h6" gutterBottom>Latest Ads</Typography>
            <Grid container spacing={2} mb={4}>
              {latestAds.map((ad, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <AdCard image={ad.image} title={ad.title} location={ad.location} />
                </Grid>
              ))}
            </Grid>

            {/* Company Websites */}
            <Typography variant="h6" gutterBottom>Company websites in Germany</Typography>
            <Grid container spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <AdCard image="https://via.placeholder.com/150" title="Original BMW leather" location="Hamburg" />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Footer />
    </>
  );
};

export default Home;
