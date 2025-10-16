const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const chatbotRoutes = require("./routes/chatbot");
app.use("/api/chatbot", chatbotRoutes);

// Mock Order API for demo
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  // Simulated order status
  const mockOrder = {
    orderId: id,
    status: "Out for delivery",
    expectedDate: "Tomorrow"
  };
  res.json(mockOrder);
});

app.listen(5000, () => console.log("Chatbot backend running on 5000"));
