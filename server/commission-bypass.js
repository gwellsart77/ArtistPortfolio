// Emergency bypass for commission form - Plain JavaScript
const { Pool } = require('pg');

// Create PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Simple commission request handler
async function handleCommissionRequest(req, res) {
  console.log("🚨 EMERGENCY BYPASS HANDLER EXECUTING");
  console.log("📥 Request body:", req.body);
  
  try {
    const { customerName, customerEmail, message, dimensions, estimatedPrice, categoryId } = req.body;
    
    // Validate required fields
    if (!customerName || !customerEmail || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("📤 Inserting with raw SQL via pg Pool");
    
    // Raw SQL insert using pg directly
    const result = await pool.query(`
      INSERT INTO commission_requests (
        customer_name,
        customer_email, 
        project_description,
        message,
        dimensions,
        estimated_price,
        category_id,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW())
      RETURNING *
    `, [
      customerName,
      customerEmail,
      message,
      message,
      dimensions || null,
      estimatedPrice || null,
      categoryId || null
    ]);

    console.log("✅ Emergency bypass insert successful:", result.rows[0]);
    
    res.json({ 
      success: true, 
      request: result.rows[0],
      message: "Commission request submitted successfully" 
    });

  } catch (error) {
    console.error("❌ Emergency bypass error:", error);
    res.status(500).json({ 
      message: "Error creating commission request",
      error: error.message 
    });
  }
}

module.exports = { handleCommissionRequest };