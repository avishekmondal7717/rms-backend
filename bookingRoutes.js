const express = require("express");
const Booking = require("../models/Booking");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Book Ticket API
router.post("/book-ticket", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Create tickets folder if not exists
    const ticketDir = path.join(__dirname, "../tickets");
    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir);
    }

    // Create PDF
    const doc = new PDFDocument();
    const fileName = `ticket_${booking._id}.pdf`;
    const filePath = path.join(ticketDir, fileName);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text("RAILWAYS TICKET INFORMATION", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Train: ${booking.train}`);
    doc.text(`From: ${booking.from}`);
    doc.text(`To: ${booking.to}`);
    doc.text(`Date: ${booking.date}`);
    doc.text(`Class: ${booking.travelClass}`);
    doc.text(`Total Fare: ₹${booking.price}`);
    doc.moveDown();

    doc.text("Passenger Details:");
    booking.passengers.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} | Age: ${p.age} | Gender: ${p.gender}`);
    });

    doc.moveDown();
    doc.text("Status: CONFIRMED", { align: "center" });

    doc.end();

    res.json({
      success: true,
      ticket: `http://localhost:5000/tickets/${fileName}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ticket booking failed"
    });
  }
});

module.exports = router;
