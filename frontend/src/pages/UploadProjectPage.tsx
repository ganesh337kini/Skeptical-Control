import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileArchive, X } from 'lucide-react';
import api from '../lib/api';

export default function UploadProjectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/api/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${data.project.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Upload failed');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        setError('Only ZIP files are allowed');
        return;
      }
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      if (!name) {
        setName(selectedFile.name.replace('.zip', ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      setError('Please select a file and provide a name');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-2">Upload Project</h1>
        <p className="text-text-darkSecondary dark:text-text-darkSecondary">Upload a microservices project as a ZIP file</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">
            Project File (ZIP)
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-accent-primary bg-accent-primary/5' : 'border-border dark:border-border-dark hover:border-accent-primary'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileArchive className="w-8 h-8 text-accent-primary" />
                <div className="text-left">
                  <div className="font-medium text-text dark:text-text-darkPrimary">{file.name}</div>
                  <div className="text-sm text-text-darkSecondary dark:text-text-darkSecondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-surface dark:hover:bg-surface-darkSecondary rounded-lg text-text-darkSecondary dark:text-text-darkSecondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-text-darkTertiary mx-auto mb-4" />
                <p className="text-text-darkSecondary dark:text-text-darkSecondary mb-2">
                  Drag and drop a ZIP file, or click to browse
                </p>
                <p className="text-xs text-text-darkTertiary">Maximum file size: 100MB</p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-4 px-4 py-2 bg-surface dark:bg-surface-darkSecondary hover:bg-surface dark:hover:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-sm font-medium cursor-pointer transition-colors"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary placeholder-text-darkTertiary focus:outline-none focus:border-accent-primary"
            placeholder="My Microservices Project"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary placeholder-text-darkTertiary focus:outline-none focus:border-accent-primary resize-none"
            placeholder="Describe your project..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!file || !name || uploading}
            className="flex-1 py-3 bg-accent-primary hover:bg-accent-primaryHover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Project
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-3 bg-surface dark:bg-surface-darkSecondary hover:bg-surface dark:hover:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
