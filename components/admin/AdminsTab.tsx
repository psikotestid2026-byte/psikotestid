'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { createAdmin, updateAdmin, deleteAdmin } from '@/app/(admin)/panel/actions';
import { useSWRConfig } from 'swr';
import { Edit2, Trash2, Plus } from 'lucide-react';

export function AdminsTab({ data }: { data: any }) {
  const { mutate } = useSWRConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SUPERADMIN',
    status: 'ACTIVE'
  });

  const handleOpenModal = (admin: any = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      });
    } else {
      setEditingAdmin(null);
      setFormData({ name: '', email: '', role: 'SUPERADMIN', status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin.id, formData);
        toast.success('Admin berhasil diperbarui');
      } else {
        await createAdmin(formData);
        toast.success('Admin berhasil ditambahkan');
      }
      setIsModalOpen(false);
      mutate('/api/admin/data');
    } catch (err: any) {
      toast.error('Gagal menyimpan admin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;
    try {
      await deleteAdmin(id);
      toast.success('Admin berhasil dihapus');
      mutate('/api/admin/data');
    } catch (err: any) {
      toast.error('Gagal menghapus admin: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Manajemen Admin</h2>
          <p className="text-sm text-slate-500">Kelola akses portal Super Admin</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Admin
        </Button>
      </div>

      <Card>
        <Table
          headers={['Nama', 'Email', 'Role', 'Status', 'Aksi']}
          isEmpty={!data.admins || data.admins.length === 0}
        >
          {data.admins?.map((admin: any) => (
            <tr key={admin.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
              <td className="py-3 px-4 text-slate-800 font-medium">{admin.name}</td>
              <td className="py-3 px-4 text-slate-500">{admin.email}</td>
              <td className="py-3 px-4">
                <Badge variant={admin.role === 'SUPERADMIN' ? 'danger' : 'warning'}>{admin.role}</Badge>
              </td>
              <td className="py-3 px-4">
                <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'default'}>{admin.status}</Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(admin)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(admin.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Google)</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
