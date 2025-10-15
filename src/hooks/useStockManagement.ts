import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from './use-toast';
import { FirestoreService } from '@/lib/firestoreService';
import { useValidation } from './useValidation';
import { productSchema, movementSchema, receiptSchema, withdrawalSchema } from '@/lib/validation';
import type { Product, Movement, Receipt, Withdrawal } from '@/types/strict';

// Hook for product management
export function useProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { validateAndToast } = useValidation(productSchema);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FirestoreService.getProducts();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProduct = useCallback(async (productData: unknown) => {
    const validation = validateAndToast(productData);
    if (!validation.isValid) return false;

    try {
      await FirestoreService.createProduct(validation.data);
      await fetchProducts();
      toast({
        title: "สำเร็จ",
        description: "เพิ่มสินค้าเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มสินค้า';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [validateAndToast, fetchProducts, toast]);

  const updateProduct = useCallback(async (id: string, productData: unknown) => {
    const validation = validateAndToast(productData);
    if (!validation.isValid) return false;

    try {
      await FirestoreService.updateProduct(id, validation.data);
      await fetchProducts();
      toast({
        title: "สำเร็จ",
        description: "อัปเดตสินค้าเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสินค้า';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [validateAndToast, fetchProducts, toast]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await FirestoreService.deleteProduct(id);
      await fetchProducts();
      toast({
        title: "สำเร็จ",
        description: "ลบสินค้าเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบสินค้า';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchProducts, toast]);

  // Computed values
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.currentStock <= p.minStock), 
    [products]
  );

  const outOfStockProducts = useMemo(() => 
    products.filter(p => p.currentStock === 0), 
    [products]
  );

  const totalValue = useMemo(() => 
    products.reduce((sum, p) => sum + (p.currentStock * p.price), 0), 
    [products]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    lowStockProducts,
    outOfStockProducts,
    totalValue,
  };
}

// Hook for movement management
export function useMovementManagement() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { validateAndToast } = useValidation(movementSchema);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FirestoreService.getMovements();
      setMovements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการเคลื่อนไหว';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createMovement = useCallback(async (movementData: unknown) => {
    const validation = validateAndToast(movementData);
    if (!validation.isValid) return false;

    try {
      await FirestoreService.createMovement(validation.data);
      await fetchMovements();
      toast({
        title: "สำเร็จ",
        description: "บันทึกการเคลื่อนไหวเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการเคลื่อนไหว';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [validateAndToast, fetchMovements, toast]);

  const deleteMovement = useCallback(async (id: string) => {
    try {
      await FirestoreService.deleteMovement(id);
      await fetchMovements();
      toast({
        title: "สำเร็จ",
        description: "ลบการเคลื่อนไหวเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบการเคลื่อนไหว';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchMovements, toast]);

  // Computed values
  const todayMovements = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return movements.filter(m => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= today;
    });
  }, [movements]);

  const recentMovements = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return movements.filter(m => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= sevenDaysAgo;
    });
  }, [movements]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    loading,
    error,
    fetchMovements,
    createMovement,
    deleteMovement,
    todayMovements,
    recentMovements,
  };
}

// Hook for receipt management
export function useReceiptManagement() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { validateAndToast } = useValidation(receiptSchema);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FirestoreService.getReceipts();
      setReceipts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการรับ';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createReceipt = useCallback(async (receiptData: unknown) => {
    const validation = validateAndToast(receiptData);
    if (!validation.isValid) return false;

    try {
      await FirestoreService.createReceipt(validation.data);
      await fetchReceipts();
      toast({
        title: "สำเร็จ",
        description: "บันทึกการรับเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการรับ';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [validateAndToast, fetchReceipts, toast]);

  const deleteReceipt = useCallback(async (id: string) => {
    try {
      await FirestoreService.deleteReceipt(id);
      await fetchReceipts();
      toast({
        title: "สำเร็จ",
        description: "ลบการรับเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบการรับ';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchReceipts, toast]);

  // Computed values
  const todayReceipts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return receipts.filter(r => {
      const receiptDate = new Date(r.createdAt);
      return receiptDate >= today;
    });
  }, [receipts]);

  const totalReceiptValue = useMemo(() => 
    receipts.reduce((sum, r) => sum + r.totalAmount, 0), 
    [receipts]
  );

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return {
    receipts,
    loading,
    error,
    fetchReceipts,
    createReceipt,
    deleteReceipt,
    todayReceipts,
    totalReceiptValue,
  };
}

// Hook for withdrawal management
export function useWithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { validateAndToast } = useValidation(withdrawalSchema);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FirestoreService.getWithdrawals();
      setWithdrawals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการเบิก';
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createWithdrawal = useCallback(async (withdrawalData: unknown) => {
    const validation = validateAndToast(withdrawalData);
    if (!validation.isValid) return false;

    try {
      await FirestoreService.createWithdrawal(validation.data);
      await fetchWithdrawals();
      toast({
        title: "สำเร็จ",
        description: "บันทึกการเบิกเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการเบิก';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [validateAndToast, fetchWithdrawals, toast]);

  const deleteWithdrawal = useCallback(async (id: string) => {
    try {
      await FirestoreService.deleteWithdrawal(id);
      await fetchWithdrawals();
      toast({
        title: "สำเร็จ",
        description: "ลบการเบิกเรียบร้อยแล้ว",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบการเบิก';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchWithdrawals, toast]);

  // Computed values
  const todayWithdrawals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return withdrawals.filter(w => {
      const withdrawalDate = new Date(w.createdAt);
      return withdrawalDate >= today;
    });
  }, [withdrawals]);

  const pendingWithdrawals = useMemo(() => 
    withdrawals.filter(w => w.status === 'pending'), 
    [withdrawals]
  );

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return {
    withdrawals,
    loading,
    error,
    fetchWithdrawals,
    createWithdrawal,
    deleteWithdrawal,
    todayWithdrawals,
    pendingWithdrawals,
  };
}
