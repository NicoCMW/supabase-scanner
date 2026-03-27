import type { Finding, ScanModule, ScanModuleResult, ScanTarget } from "@/types/scanner";
import { supabaseGet } from "../supabase-client";
import { createFinding } from "../utils";

interface BucketInfo {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
}

/**
 * List all storage buckets accessible with the anon key.
 */
async function listBuckets(target: ScanTarget): Promise<readonly BucketInfo[]> {
  const response = await supabaseGet(target, "/storage/v1/bucket");

  if (response.status !== 200 || !Array.isArray(response.data)) {
    return [];
  }

  return (response.data as BucketInfo[]).map((b) => ({
    id: b.id,
    name: b.name,
    public: b.public,
  }));
}

/**
 * Test if a bucket's files are listable with anon key.
 */
async function testBucketListAccess(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
  const response = await supabaseGet(
    target,
    `/storage/v1/object/list/${bucket.name}`,
  );

  if (response.status === 200 && Array.isArray(response.data)) {
    const fileCount = (response.data as unknown[]).length;

    return createFinding({
      title: `Storage bucket "${bucket.name}" is listable`,
      description: `The storage bucket "${bucket.name}" allows anonymous users to list its contents. ${fileCount} object(s) found. Attackers can enumerate all files in this bucket.`,
      severity: fileCount > 0 ? "high" : "medium",
      category: "storage",
      resource: `storage/${bucket.name}`,
      details: {
        bucketName: bucket.name,
        bucketId: bucket.id,
        isPublic: bucket.public,
        objectCount: fileCount,
      },
      remediation: `Restrict the SELECT policy on storage.objects for bucket "${bucket.name}" to authenticated users or specific roles.`,
    });
  }

  return null;
}

/**
 * Test if a bucket allows anonymous file uploads.
 */
async function testBucketWriteAccess(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
  // Non-destructive: attempt upload with a content-length of 0 and a test path
  // The storage API will reject due to missing/invalid file but the HTTP status
  // tells us if the policy allows it.
  const url = `${target.supabaseUrl}/storage/v1/object/${bucket.name}/.supabase-scanner-test`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": "0",
    },
    body: "",
  });

  // 200 or 201 = upload succeeded (very bad -- clean it up)
  if (response.status === 200 || response.status === 201) {
    // Attempt cleanup
    await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: target.anonKey,
        Authorization: `Bearer ${target.anonKey}`,
      },
    });

    return createFinding({
      title: `Storage bucket "${bucket.name}" allows anonymous uploads`,
      description: `The storage bucket "${bucket.name}" accepted a file upload from an unauthenticated user. Attackers could upload malicious files or exhaust storage quota.`,
      severity: "critical",
      category: "storage",
      resource: `storage/${bucket.name}`,
      details: {
        bucketName: bucket.name,
        bucketId: bucket.id,
        isPublic: bucket.public,
      },
      remediation: `Add a restrictive INSERT policy on storage.objects for bucket "${bucket.name}". Only allow authenticated users to upload.`,
    });
  }

  // 400 with a body-related error may also indicate the policy allows writes
  if (response.status === 400) {
    const body = await response.text();
    if (body.includes("empty") || body.includes("size")) {
      return createFinding({
        title: `Storage bucket "${bucket.name}" may allow anonymous uploads`,
        description: `The storage bucket "${bucket.name}" rejected an empty upload but the error suggests the INSERT policy is permissive. A properly-formed upload may succeed.`,
        severity: "high",
        category: "storage",
        resource: `storage/${bucket.name}`,
        details: {
          bucketName: bucket.name,
          bucketId: bucket.id,
          errorHint: body.slice(0, 200),
        },
        remediation: `Review INSERT policies on storage.objects for bucket "${bucket.name}" and restrict to authenticated users.`,
      });
    }
  }

  return null;
}

/**
 * Flag buckets marked as public.
 */
function checkPublicBucket(bucket: BucketInfo): Finding | null {
  if (bucket.public) {
    return createFinding({
      title: `Storage bucket "${bucket.name}" is marked public`,
      description: `The bucket "${bucket.name}" has public access enabled. All objects are accessible without authentication via their URL. This is appropriate for public assets but dangerous for sensitive data.`,
      severity: "medium",
      category: "storage",
      resource: `storage/${bucket.name}`,
      details: {
        bucketName: bucket.name,
        bucketId: bucket.id,
        isPublic: true,
      },
      remediation: `If this bucket contains sensitive data, set it to private: UPDATE storage.buckets SET public = false WHERE id = '${bucket.id}';`,
    });
  }
  return null;
}

export const storageAuditModule: ScanModule = {
  name: "Storage Audit",

  async run(target: ScanTarget): Promise<ScanModuleResult> {
    const start = Date.now();
    const findings: Finding[] = [];

    const buckets = await listBuckets(target);

    const [listResults, writeResults] = await Promise.all([
      Promise.all(buckets.map((b) => testBucketListAccess(target, b))),
      Promise.all(buckets.map((b) => testBucketWriteAccess(target, b))),
    ]);

    const publicResults = buckets.map(checkPublicBucket);

    for (const finding of [...listResults, ...writeResults, ...publicResults]) {
      if (finding) {
        findings.push(finding);
      }
    }

    if (buckets.length === 0) {
      findings.push(
        createFinding({
          title: "No storage buckets found",
          description:
            "No storage buckets were accessible via the anon key. This may be intentional or the storage API may be restricted.",
          severity: "low",
          category: "storage",
          resource: "storage",
          details: { bucketsFound: 0 },
          remediation: "No action required if storage is not used.",
        }),
      );
    }

    return {
      module: "Storage Audit",
      findings,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  },
};
