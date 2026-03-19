import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface BulkImportProps {
  table: 'drivers' | 'constructors' | 'seasons' | 'races';
  onSuccess: () => void;
}

export default function BulkImport({ table, onSuccess }: BulkImportProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        const data = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            // Basic type conversion
            let value: any = values[index];
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            if (!isNaN(Number(value)) && value !== '') value = Number(value);
            obj[header] = value;
          });
          return obj;
        });

        const { error: importError } = await supabase.from(table).insert(data);

        if (importError) throw importError;

        setSuccess(`Successfully imported ${data.length} items to ${table}.`);
        onSuccess();
      } catch (err: any) {
        console.error('Import error:', err);
        setError(err.message || 'Failed to import data. Check CSV format.');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Bulk Import ({table})</h3>
        <div className="text-xs text-gray-500">CSV format required</div>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {importing ? (
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
            )}
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV file only</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileUpload}
            disabled={importing}
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
          Expected Headers:
          <p className="mt-1 lowercase font-mono">
            {table === 'drivers' && 'name, nationality, dob, image_url, bio'}
            {table === 'constructors' && 'name, nationality, logo_url, base, bio'}
            {table === 'seasons' && 'year, champion_driver_id, champion_constructor_id, image_url'}
            {table === 'races' && 'season_id, name, circuit, date, round, image_url, youtube_url'}
          </p>
        </div>
      </div>
    </div>
  );
}
