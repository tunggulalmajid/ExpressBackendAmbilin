const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API Ambilin Backend is running!",
    docs: "/api-docs",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
