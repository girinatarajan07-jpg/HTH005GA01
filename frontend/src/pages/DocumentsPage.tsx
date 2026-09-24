import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  getDocuments,
  uploadPolicies,
  uploadContract,
  deleteDocument,
} from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { UploadProgress, type FileProgress } from '../components/documents/UploadProgress';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { APP_CONFIG } from '../config/constants';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploadProgressList, setUploadProgressList] = useState<FileProgress[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Fetch documents
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const policies = data?.policies || [];
  const contract = data?.contract || null;

  // Upload policies mutation
  const uploadPoliciesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadProgressList(
        files.map((f) => ({
          fileName: f.name,
          percent: 0,
          status: 'uploading',
        }))
      );

      return uploadPolicies(files, (fileName, percent) => {
        setUploadProgressList((prev) =>
          prev.map((item) =>
            item.fileName === fileName
              ? {
                  ...item,
                  percent,
                  status: percent >= 100 ? 'complete' : 'uploading',
                }
              : item
          )
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setTimeout(() => setUploadProgressList([]), 3000);
    },
    onError: (err: any) => {
      setUploadProgressList((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'error',
          errorMessage: err?.message || 'Upload failed',
        }))
      );
    },
  });

  // Upload contract mutation
  const uploadContractMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgressList([
        {
          fileName: file.name,
          percent: 0,
          status: 'uploading',
        },
      ]);

      return uploadContract(file, (percent) => {
        setUploadProgressList([
          {
            fileName: file.name,
            percent,
            status: percent >= 100 ? 'complete' : 'uploading',
          },
        ]);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setTimeout(() => setUploadProgressList([]), 3000);
    },
    onError: (err: any) => {
      setUploadProgressList((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'error',
          errorMessage: err?.message || 'Upload failed',
        }))
      );
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteTarget(null);
    },
  });

  // Document validation for continuing to review
  const hasValidPolicyCount = policies.length >= APP_CONFIG.minPolicies && policies.length <= APP_CONFIG.maxPolicies;
  const hasContract = contract !== null;
  const isReadyForAnalysis = hasValidPolicyCount && hasContract;

  // Validation messages
  const validationWarnings: string[] = [];
  if (policies.length < APP_CONFIG.minPolicies) {
    validationWarnings.push(
      `Add at least ${APP_CONFIG.minPolicies} policy documents (${policies.length} of ${APP_CONFIG.minPolicies} currently uploaded).`
    );
  }
  if (policies.length > APP_CONFIG.maxPolicies) {
    validationWarnings.push(
      `A maximum of ${APP_CONFIG.maxPolicies} policies can be analyzed at once (${policies.length} uploaded). Please remove ${
        policies.length - APP_CONFIG.maxPolicies
      }.`
    );
  }
  if (!hasContract) {
    validationWarnings.push('Upload exactly one contract for compliance review.');
  }

  const existingPolicyNames = policies.map((p) => p.name);

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Document Library"
        subtitle="Manage the internal compliance policy vault and the target contract for review."
        actions={
          <button
            type="button"
            onClick={() => navigate('/analysis')}
            disabled={!isReadyForAnalysis}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed focus-visible:outline-sky-700 transition-colors"
          >
            <span>Continue to Review</span>
            <ArrowRight size={14} />
          </button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Requirements Banner */}
        <div
          className={`rounded-md border p-4 shadow-sm flex items-start gap-3 transition-colors ${
            isReadyForAnalysis
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
              : 'border-sky-200 bg-sky-50/70 text-sky-950'
          }`}
        >
          {isReadyForAnalysis ? (
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <Info size={18} className="text-sky-700 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h3 className="font-semibold text-slate-900">
              {isReadyForAnalysis
                ? 'Ready for Compliance Analysis'
                : 'Requirement: Add 3–5 policy documents and one contract.'}
            </h3>
            {validationWarnings.length > 0 ? (
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-600">
                {validationWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-emerald-800">
                All document criteria met ({policies.length} policies, 1 contract). You can proceed to analysis.
              </p>
            )}
          </div>
        </div>

        {/* Global Loading / Error */}
        {isLoading && <LoadingState label="Loading document library..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Failed to load documents"
            onRetry={() => refetch()}
          />
        )}

        {/* Upload Progress tracker */}
        {uploadProgressList.length > 0 && (
          <UploadProgress progressList={uploadProgressList} />
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Section 1: Policies (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Internal Policy Documents
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enterprise ground-truth standards against which clauses are verified
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                    hasValidPolicyCount
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {policies.length} / 5 policies
                </span>
              </div>

              {/* Policy Uploader */}
              <DocumentUploader
                mode="policy"
                title="Upload Internal Policies"
                multiple
                existingNames={existingPolicyNames}
                isUploading={uploadPoliciesMutation.isPending}
                onUpload={async (files) => {
                  await uploadPoliciesMutation.mutateAsync(files);
                }}
              />

              {/* Policy Cards List */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Uploaded Policies ({policies.length})
                </h3>
                {policies.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">
                    No policy documents uploaded yet. Upload between 3 and 5 PDF policies to proceed.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {policies.map((policy) => (
                      <DocumentCard
                        key={policy.id}
                        document={policy}
                        badgeLabel="Internal Policy"
                        onDelete={(id, name) => setDeleteTarget({ id, name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Contract for Review (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Contract for Review
                  </h2>
                  <p className="text-xs text-slate-500">
                    Target vendor contract or agreement to analyze
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                    contract
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {contract ? '1 loaded' : '0 loaded'}
                </span>
              </div>

              {contract ? (
                <div className="space-y-3">
                  <DocumentCard
                    document={contract}
                    isContract
                    badgeLabel="Target Contract"
                    onDelete={(id, name) => setDeleteTarget({ id, name })}
                  />

                  {/* Replace contract uploader */}
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Replace Target Contract
                    </p>
                    <DocumentUploader
                      mode="contract"
                      title="Replace Contract"
                      description="Upload a new contract PDF to replace the current one."
                      multiple={false}
                      isUploading={uploadContractMutation.isPending}
                      onUpload={async (files) => {
                        if (files[0]) {
                          await uploadContractMutation.mutateAsync(files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <DocumentUploader
                  mode="contract"
                  title="Upload Contract"
                  multiple={false}
                  isUploading={uploadContractMutation.isPending}
                  onUpload={async (files) => {
                    if (files[0]) {
                      await uploadContractMutation.mutateAsync(files[0]);
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deletions */}
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        title="Remove Document"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? Any active references will be updated.`}
        confirmLabel="Remove"
        isDestructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
