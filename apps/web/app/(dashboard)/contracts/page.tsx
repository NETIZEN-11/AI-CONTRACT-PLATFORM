'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, Contract } from '@/lib/api';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await api.getContracts();
        setContracts(response.data);
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContracts();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage your contracts and agreements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="grid gap-4">
        {contracts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
            <p className="text-muted-foreground mb-6">Upload your first contract to get started</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Contract
            </Button>
          </div>
        ) : (
          contracts.map((contract) => (
            <div key={contract.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{contract.title}</h3>
                    {contract.description && (
                      <p className="text-muted-foreground text-sm mt-1">{contract.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {contract.effective_date ? new Date(contract.effective_date).toLocaleDateString() : 'N/A'}
                      </span>
                      {contract.value && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {contract.value.toLocaleString()} {contract.currency}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'active' ? 'bg-green-100 text-green-700' :
                        contract.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
