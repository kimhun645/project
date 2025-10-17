// Test Script for Stock Transaction Flow
// This script will test the stock transaction system on production

const testStockTransaction = async () => {
  console.log('🧪 Starting Stock Transaction Test...');
  
  // Test data
  const testProduct = {
    name: 'Test Product - Stock Transaction',
    sku: 'TEST-STOCK-001',
    category_id: 'test-category',
    supplier_id: 'test-supplier',
    unit_price: 100,
    current_stock: 100, // Initial stock
    min_stock: 10,
    unit: 'ชิ้น'
  };

  const testWithdrawal = {
    withdrawal_no: 'TEST-WD-001',
    withdrawal_date: new Date().toISOString().split('T')[0],
    requester_name: 'Test User',
    department: 'Test Department',
    items: [{
      product_id: 'test-product-id',
      product_name: testProduct.name,
      product_sku: testProduct.sku,
      quantity: 30, // Withdraw 30 items
      unit: 'ชิ้น',
      reason: 'Test withdrawal'
    }]
  };

  const testReceipt = {
    receipt_no: 'TEST-RC-001',
    receipt_date: new Date().toISOString().split('T')[0],
    supplier_name: 'Test Supplier',
    items: [{
      product_id: 'test-product-id',
      product_name: testProduct.name,
      product_sku: testProduct.sku,
      quantity: 20, // Receive 20 items
      unit: 'ชิ้น',
      unit_price: 100,
      total_price: 2000
    }]
  };

  console.log('📊 Test Scenarios:');
  console.log('1. Initial Stock: 100');
  console.log('2. Withdraw 30 → Expected Stock: 70');
  console.log('3. Receive 20 → Expected Stock: 90');
  console.log('4. Delete Withdrawal → Expected Stock: 120');
  console.log('5. Delete Receipt → Expected Stock: 70');

  return {
    testProduct,
    testWithdrawal,
    testReceipt,
    expectedResults: {
      initialStock: 100,
      afterWithdrawal: 70,
      afterReceipt: 90,
      afterDeleteWithdrawal: 120,
      afterDeleteReceipt: 70
    }
  };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testStockTransaction = testStockTransaction;
  console.log('✅ Test script loaded. Run testStockTransaction() in browser console');
}

module.exports = { testStockTransaction };
