const salaryService = require('../services/salaryService');

describe('Salary Calculation Engine', () => {
  test('Slab 1 (Gross <= 21,000): Should deduct 12% PF, 0.75% ESIC, and 0% TDS', () => {
    const gross = 20000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(20000);
    expect(result.basic).toBe(10000); // 50% of gross
    expect(result.pf).toBe(1200);      // 12% of basic
    expect(result.esic).toBe(150);      // 0.75% of gross
    expect(result.tds).toBe(0);         // 0% TDS
    expect(result.totalDeductions).toBe(1350);
    expect(result.netPay).toBe(18650);  // gross - deductions
    expect(result.employerContributions.pf).toBe(1200);
    expect(result.employerContributions.esic).toBe(650); // 3.25% of gross
    expect(result.ctc).toBe(21850);    // gross + employer contributions
  });

  test('Slab 2 (Gross > 25,000 and <= 50,000): Should deduct 12% PF, 0% ESIC, and 5% TDS', () => {
    const gross = 40000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(40000);
    expect(result.basic).toBe(20000);
    expect(result.pf).toBe(2400);
    expect(result.esic).toBe(0);        // Exceeds 21,000
    expect(result.tds).toBe(2000);      // 5% of gross
    expect(result.totalDeductions).toBe(4400);
    expect(result.netPay).toBe(35600);
    expect(result.employerContributions.esic).toBe(0);
    expect(result.ctc).toBe(42400);
  });

  test('Slab 3 (Gross > 50,000 and <= 75,000): Should deduct 12% PF, 0% ESIC, and 10% TDS', () => {
    const gross = 60000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(60000);
    expect(result.pf).toBe(3600);
    expect(result.tds).toBe(6000);      // 10% of gross
    expect(result.netPay).toBe(50400);
  });

  test('Slab 4 (Gross > 75,000 and <= 1,00,000): Should deduct 12% PF, 0% ESIC, and 15% TDS', () => {
    const gross = 80000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(80000);
    expect(result.pf).toBe(4800);
    expect(result.tds).toBe(12000);     // 15% of gross
    expect(result.netPay).toBe(63200);
  });

  test('Slab 5 (Gross > 1,00,000 and <= 1,50,000): Should deduct 12% PF, 0% ESIC, and 20% TDS', () => {
    const gross = 120000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(120000);
    expect(result.pf).toBe(7200);
    expect(result.tds).toBe(24000);     // 20% of gross
    expect(result.netPay).toBe(88800);
  });

  test('Slab 6 (Gross > 1,50,000): Should deduct 12% PF, 0% ESIC, and 30% TDS', () => {
    const gross = 180000;
    const result = salaryService.calculateDeductions(gross);

    expect(result.gross).toBe(180000);
    expect(result.pf).toBe(10800);
    expect(result.tds).toBe(54000);     // 30% of gross
    expect(result.netPay).toBe(115200);
  });
});
