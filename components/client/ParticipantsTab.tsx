'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Eye, FileDown } from 'lucide-react';
import { ParticipantDetailModal } from './ParticipantDetailModal';

interface ParticipantsTabProps {
  data: any;
}

export function ParticipantsTab({ data }: ParticipantsTabProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);

  return (
    <div className="w-full animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Hasil Kandidat</h2>
      <Card noPadding className="overflow-hidden">
        <Table headers={["Nama Kandidat", "Email", "Sesi (Campaign)", "Status", "Aksi"]} isEmpty={data.participants.length === 0}>
          {data.participants.map((p: any) => {
            const testResults = Array.isArray(p.test_results)
              ? p.test_results
              : typeof p.test_results === 'string'
              ? JSON.parse(p.test_results)
              : [];
            const discResult = testResults.find((r: any) => r.scoring_data);

            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-800">{p.full_name}</td>
                <td className="py-4 px-4 text-slate-500">{p.email}</td>
                <td className="py-4 px-4 text-slate-600 font-medium">{p.campaign_title || '-'}</td>
                <td className="py-4 px-4">
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {p.status}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => setSelectedParticipant(p)}
                    >
                      Lihat Hasil
                    </Button>
                    {discResult && (
                      <a
                        href={`/api/reports/disc/${discResult.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                        <FileDown className="w-4 h-4" /> PDF
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
}

