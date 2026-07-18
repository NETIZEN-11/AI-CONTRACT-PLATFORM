import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, John Doe</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Contract
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Total Contracts</p>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold">247</p>
          <p className="text-xs text-accent">+12 this month</p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Pending Reviews</p>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">23</p>
          <p className="text-xs text-muted-foreground">Awaiting action</p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">High Risk</p>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">8</p>
          <p className="text-xs text-red-500">Require attention</p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Compliant</p>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">216</p>
          <p className="text-xs text-green-500">98% compliance</p>
        </Card>
      </div>

      {/* Recent Contracts */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Recent Contracts</h2>
          <p className="text-sm text-muted-foreground">Contracts analyzed in the last 7 days</p>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Service Agreement.pdf', status: 'Analyzed', risk: 'Low', date: '2 hours ago' },
            { name: 'NDA_2024.docx', status: 'Pending', risk: 'Medium', date: '5 hours ago' },
            {
              name: 'Employment_Contract.pdf',
              status: 'Analyzed',
              risk: 'High',
              date: '1 day ago',
            },
          ].map((contract) => (
            <div
              key={contract.name}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition cursor-pointer border border-border/50"
            >
              <div className="flex-1">
                <p className="font-medium">{contract.name}</p>
                <p className="text-sm text-muted-foreground">{contract.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    contract.risk === 'Low'
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : contract.risk === 'Medium'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      contract.risk === 'Low'
                        ? 'bg-green-500'
                        : contract.risk === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                  ></span>
                  {contract.risk} Risk
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    contract.status === 'Analyzed'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {contract.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
