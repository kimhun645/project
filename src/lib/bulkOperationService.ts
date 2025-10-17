export interface BulkOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'import' | 'export';
  items: T[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  errors: string[];
  createdAt: string;
  completedAt?: string;
}

export interface BulkOperationResult<T> {
  success: T[];
  failed: Array<{ item: T; error: string }>;
  total: number;
  successCount: number;
  failureCount: number;
}

export class BulkOperationService {
  private static operations: Map<string, BulkOperation<any>> = new Map();

  // Create bulk operation
  static createOperation<T>(
    type: 'create' | 'update' | 'delete' | 'import' | 'export',
    items: T[]
  ): string {
    const id = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: BulkOperation<T> = {
      id,
      type,
      items,
      status: 'pending',
      progress: 0,
      total: items.length,
      errors: [],
      createdAt: new Date().toISOString()
    };

    this.operations.set(id, operation);
    return id;
  }

  // Get operation status
  static getOperation<T>(id: string): BulkOperation<T> | undefined {
    return this.operations.get(id);
  }

  // Update operation status
  static updateOperationStatus<T>(
    id: string,
    status: BulkOperation<T>['status'],
    progress?: number,
    errors?: string[]
  ): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.status = status;
      if (progress !== undefined) operation.progress = progress;
      if (errors) operation.errors = [...operation.errors, ...errors];
      if (status === 'completed' || status === 'failed') {
        operation.completedAt = new Date().toISOString();
      }
    }
  }

  // Execute bulk create
  static async executeBulkCreate<T>(
    items: T[],
    createFunction: (item: T) => Promise<void>,
    onProgress?: (progress: number, total: number) => void
  ): Promise<BulkOperationResult<T>> {
    const operationId = this.createOperation('create', items);
    const result: BulkOperationResult<T> = {
      success: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    this.updateOperationStatus(operationId, 'processing');

    for (let i = 0; i < items.length; i++) {
      try {
        await createFunction(items[i]);
        result.success.push(items[i]);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          item: items[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failureCount++;
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      this.updateOperationStatus(operationId, 'processing', progress);
      onProgress?.(i + 1, items.length);
    }

    this.updateOperationStatus(
      operationId,
      result.failureCount === 0 ? 'completed' : 'failed'
    );

    return result;
  }

  // Execute bulk update
  static async executeBulkUpdate<T>(
    items: T[],
    updateFunction: (item: T) => Promise<void>,
    onProgress?: (progress: number, total: number) => void
  ): Promise<BulkOperationResult<T>> {
    const operationId = this.createOperation('update', items);
    const result: BulkOperationResult<T> = {
      success: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    this.updateOperationStatus(operationId, 'processing');

    for (let i = 0; i < items.length; i++) {
      try {
        await updateFunction(items[i]);
        result.success.push(items[i]);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          item: items[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failureCount++;
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      this.updateOperationStatus(operationId, 'processing', progress);
      onProgress?.(i + 1, items.length);
    }

    this.updateOperationStatus(
      operationId,
      result.failureCount === 0 ? 'completed' : 'failed'
    );

    return result;
  }

  // Execute bulk delete
  static async executeBulkDelete<T>(
    items: T[],
    deleteFunction: (item: T) => Promise<void>,
    onProgress?: (progress: number, total: number) => void
  ): Promise<BulkOperationResult<T>> {
    const operationId = this.createOperation('delete', items);
    const result: BulkOperationResult<T> = {
      success: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    this.updateOperationStatus(operationId, 'processing');

    for (let i = 0; i < items.length; i++) {
      try {
        await deleteFunction(items[i]);
        result.success.push(items[i]);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          item: items[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failureCount++;
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      this.updateOperationStatus(operationId, 'processing', progress);
      onProgress?.(i + 1, items.length);
    }

    this.updateOperationStatus(
      operationId,
      result.failureCount === 0 ? 'completed' : 'failed'
    );

    return result;
  }

  // Execute bulk import
  static async executeBulkImport<T>(
    items: T[],
    importFunction: (item: T) => Promise<void>,
    onProgress?: (progress: number, total: number) => void
  ): Promise<BulkOperationResult<T>> {
    const operationId = this.createOperation('import', items);
    const result: BulkOperationResult<T> = {
      success: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    this.updateOperationStatus(operationId, 'processing');

    for (let i = 0; i < items.length; i++) {
      try {
        await importFunction(items[i]);
        result.success.push(items[i]);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          item: items[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failureCount++;
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      this.updateOperationStatus(operationId, 'processing', progress);
      onProgress?.(i + 1, items.length);
    }

    this.updateOperationStatus(
      operationId,
      result.failureCount === 0 ? 'completed' : 'failed'
    );

    return result;
  }

  // Execute bulk export
  static async executeBulkExport<T>(
    items: T[],
    exportFunction: (item: T) => Promise<void>,
    onProgress?: (progress: number, total: number) => void
  ): Promise<BulkOperationResult<T>> {
    const operationId = this.createOperation('export', items);
    const result: BulkOperationResult<T> = {
      success: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    this.updateOperationStatus(operationId, 'processing');

    for (let i = 0; i < items.length; i++) {
      try {
        await exportFunction(items[i]);
        result.success.push(items[i]);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          item: items[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failureCount++;
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      this.updateOperationStatus(operationId, 'processing', progress);
      onProgress?.(i + 1, items.length);
    }

    this.updateOperationStatus(
      operationId,
      result.failureCount === 0 ? 'completed' : 'failed'
    );

    return result;
  }

  // Get all operations
  static getAllOperations(): BulkOperation<any>[] {
    return Array.from(this.operations.values());
  }

  // Get operations by status
  static getOperationsByStatus(status: BulkOperation<any>['status']): BulkOperation<any>[] {
    return Array.from(this.operations.values()).filter(op => op.status === status);
  }

  // Clear completed operations
  static clearCompletedOperations(): void {
    for (const [id, operation] of this.operations.entries()) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        this.operations.delete(id);
      }
    }
  }

  // Clear all operations
  static clearAllOperations(): void {
    this.operations.clear();
  }

  // Get operation statistics
  static getOperationStatistics(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const operations = Array.from(this.operations.values());
    return {
      total: operations.length,
      pending: operations.filter(op => op.status === 'pending').length,
      processing: operations.filter(op => op.status === 'processing').length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length
    };
  }
}
