const express = require("express");
const UserRoutes = require("./routes/users");
const logRequest = require("./middleware/log");

const app = express();

app.use(logRequest.logRequest);
app.use(express.json());
app.use("/users", UserRoutes);
i;

app.listen(4000, () => {
  console.log("server berhassil di running di port 4000");
});
