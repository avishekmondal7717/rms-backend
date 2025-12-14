require("dotenv").config();

const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());

// ---------------- Static tickets folder ----------------
const ticketsFolder = path.join(__dirname, "tickets");
if (!fs.existsSync(ticketsFolder)) {
  fs.mkdirSync(ticketsFolder);
}
app.use("/tickets", express.static(ticketsFolder));

// ---------------- Payment routes ----------------
app.use("/api/payment", require("./paymentRoutes"));

// ---------------- Health check ----------------
app.get("/", (req, res) => {
  res.send("✅ Railway Backend is running");
});

// ---------------- Ticket booking API ----------------
app.post("/api/book-ticket", (req, res) => {
  try {
    const { train, from, to, date, travelClass, passengers, price } = req.body;

    const ticketId = Date.now();
    const fileName = `ticket_${ticketId}.pdf`;
    const pdfPath = path.join(ticketsFolder, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    // ---- Ticket Design ----
    doc.fontSize(20).text("RAILWAYS TICKET INFORMATION", { align: "center" });
    doc.moveDown();

    doc.fontSize(13).text(`Train: ${train}`);
    doc.text(`From: ${from}`);
    doc.text(`To: ${to}`);
    doc.text(`Date of Journey: ${date}`);
    doc.text(`Class: ${travelClass}`);
    doc.text(`Total Fare: ₹${price}`);
    doc.moveDown();

    doc.text("Passenger Details:", { underline: true });
    passengers.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} | Age: ${p.age} | Gender: ${p.gender}`);
    });

    doc.moveDown();
    doc.text("Status: CONFIRMED", { align: "center" });

    doc.end();

    // ---- Response ----
    res.json({
      success: true,
      ticket: `http://localhost:${process.env.PORT || 5000}/tickets/${fileName}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Booking failed!"
    });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚆 Server running on http://localhost:${PORT}`);
});
