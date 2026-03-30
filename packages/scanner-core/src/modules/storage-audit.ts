import type { Finding, ScanModule, ScanModuleResult, ScanTarget } from "../types";
import { supabaseGet, supabasePost } from "../supabase-client";
import { createFinding } from "../utils";

interface BucketInfo {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly fileSizeLimit: number | null;
  readonly allowedMimeTypes: readonly string[] | null;
}

interface StorageObject {
  readonly name: string;
  readonly id: string;
  readonly metadata: {
    readonly mimetype: string;
    readonly size: number;
  } | null;
}

const SENSITIVE_MIME_PREFIXES: readonly string[] = [
  "application/pdf",
  "application/zip",
  "application/gzip",
  "application/x-tar",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument",
  "application/msword",
  "application/x-sqlite3",
  "application/sql",
  "application/x-csv",
  "text/csv",
  "application/json",
];

async function listBuckets(target: ScanTarget): Promise<readonly BucketInfo[]> {
  const response = await supabaseGet(target, "/storage/v1/bucket");

  if (response.status !== 200 || !Array.isArray(response.data)) {
    return [];
  }

  return (response.data as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    name: String(b.name),
    public: Boolean(b.public),
    fileSizeLimit: typeof b.file_size_limit === "number" ? b.file_size_limit : null,
    allowedMimeTypes: Array.isArray(b.allowed_mime_types)
      ? (b.allowed_mime_types as string[])
      : null,
  }));
}

async function listBucketObjects(
  target: ScanTarget,
  bucketName: string,
): Promise<readonly StorageObject[]> {
  const response = await supabaseGet(
    target,
    `/storage/v1/object/list/${bucketName}`,
  );

  if (response.status !== 200 || !Array.isArray(response.data)) {
    return [];
  }

  return (response.data as Array<Record<string, unknown>>).map((obj) => {
    const meta = obj.metadata as Record<string, unknown> | null;
    return {
      name: String(obj.name),
      id: String(obj.id ?? ""),
      metadata: meta
        ? {
            mimetype: String(meta.mimetype ?? ""),
            size: typeof meta.size === "number" ? meta.size : 0,
          }
        : null,
    };
  });
}

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

async function testBucketWriteAccess(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
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

  if (response.status === 200 || response.status === 201) {
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

async function checkPublicBucketContentTypes(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
  if (!bucket.public) {
    return null;
  }

  const objects = await listBucketObjects(target, bucket.name);
  if (objects.length === 0) {
    return null;
  }

  const sensitiveObjects = objects.filter((obj) => {
    const mime = obj.metadata?.mimetype ?? "";
    return SENSITIVE_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
  });

  if (sensitiveObjects.length === 0) {
    return null;
  }

  const mimeBreakdown: Record<string, number> = {};
  for (const obj of sensitiveObjects) {
    const mime = obj.metadata?.mimetype ?? "unknown";
    mimeBreakdown[mime] = (mimeBreakdown[mime] ?? 0) + 1;
  }

  return createFinding({
    title: `Public bucket "${bucket.name}" contains sensitive file types`,
    description: `The public bucket "${bucket.name}" contains ${sensitiveObjects.length} file(s) with sensitive MIME types (documents, spreadsheets, databases, archives). These files are accessible to anyone without authentication.`,
    severity: "high",
    category: "storage",
    resource: `storage/${bucket.name}`,
    details: {
      bucketName: bucket.name,
      bucketId: bucket.id,
      sensitiveFileCount: sensitiveObjects.length,
      totalFileCount: objects.length,
      mimeBreakdown,
      sampleFiles: sensitiveObjects.slice(0, 5).map((o) => ({
        name: o.name,
        mimetype: o.metadata?.mimetype,
      })),
    },
    remediation: `Move sensitive files to a private bucket or set this bucket to private: UPDATE storage.buckets SET public = false WHERE id = '${bucket.id}'; Review whether these files need public access.`,
  });
}

async function checkStorageObjectsRls(
  target: ScanTarget,
): Promise<Finding | null> {
  const response = await supabaseGet(target, "/rest/v1/objects?select=id&limit=1", {
    headers: {
      Accept: "application/json",
      "Accept-Profile": "storage",
    },
  });

  if (response.status === 200 && Array.isArray(response.data)) {
    const hasData = (response.data as unknown[]).length > 0;
    return createFinding({
      title: "storage.objects table is accessible via REST API",
      description: `The storage.objects table is exposed through PostgREST and ${hasData ? "returned data" : "is queryable"} with the anonymous key. This bypasses Storage API access controls and may allow direct read/write access to all stored files metadata.`,
      severity: hasData ? "critical" : "high",
      category: "storage",
      resource: "storage.objects",
      details: {
        accessible: true,
        hasData,
      },
      remediation: `Ensure RLS is enabled on storage.objects and policies restrict anonymous access:\nALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\nRevoke direct REST access to the storage schema if not needed.`,
    });
  }

  return null;
}

function checkUploadRestrictions(bucket: BucketInfo): readonly Finding[] {
  const findings: Finding[] = [];

  if (bucket.fileSizeLimit === null) {
    findings.push(
      createFinding({
        title: `Bucket "${bucket.name}" has no file size limit`,
        description: `The storage bucket "${bucket.name}" does not enforce a file size limit. Without a size limit, attackers with upload access could exhaust storage quota by uploading very large files.`,
        severity: "medium",
        category: "storage",
        resource: `storage/${bucket.name}`,
        details: {
          bucketName: bucket.name,
          bucketId: bucket.id,
          fileSizeLimit: null,
        },
        remediation: `Set a file size limit on the bucket: UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = '${bucket.id}'; (5 MB example, adjust to your needs)`,
      }),
    );
  }

  if (bucket.allowedMimeTypes === null) {
    findings.push(
      createFinding({
        title: `Bucket "${bucket.name}" has no MIME type restrictions`,
        description: `The storage bucket "${bucket.name}" does not restrict upload file types. Without MIME type restrictions, users could upload executable files, HTML (for XSS), or other dangerous content types.`,
        severity: "medium",
        category: "storage",
        resource: `storage/${bucket.name}`,
        details: {
          bucketName: bucket.name,
          bucketId: bucket.id,
          allowedMimeTypes: null,
        },
        remediation: `Restrict allowed MIME types on the bucket: UPDATE storage.buckets SET allowed_mime_types = '{"image/png","image/jpeg","image/gif"}' WHERE id = '${bucket.id}'; (adjust types to your needs)`,
      }),
    );
  }

  return findings;
}

async function testBucketDeleteAccess(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
  const url = `${target.supabaseUrl}/storage/v1/object/${bucket.name}/.supabase-scanner-delete-probe`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
    },
  });

  if (response.status === 200) {
    return createFinding({
      title: `Storage bucket "${bucket.name}" allows anonymous deletes`,
      description: `The storage bucket "${bucket.name}" accepted a DELETE request from an unauthenticated user. Attackers could delete files from this bucket, causing data loss.`,
      severity: "critical",
      category: "storage",
      resource: `storage/${bucket.name}`,
      details: {
        bucketName: bucket.name,
        bucketId: bucket.id,
      },
      remediation: `Add a restrictive DELETE policy on storage.objects for bucket "${bucket.name}": CREATE POLICY "deny_anon_delete" ON storage.objects FOR DELETE TO anon USING (false);`,
    });
  }

  if (response.status === 400) {
    const body = await response.text();
    if (!body.includes("not found") && !body.includes("Not Found")) {
      return createFinding({
        title: `Storage bucket "${bucket.name}" may allow anonymous deletes`,
        description: `The storage bucket "${bucket.name}" did not reject the DELETE request with a permissions error. The DELETE policy may be permissive for anonymous users.`,
        severity: "high",
        category: "storage",
        resource: `storage/${bucket.name}`,
        details: {
          bucketName: bucket.name,
          bucketId: bucket.id,
          errorHint: body.slice(0, 200),
        },
        remediation: `Review DELETE policies on storage.objects for bucket "${bucket.name}" and restrict to authenticated users.`,
      });
    }
  }

  return null;
}

async function checkSignedUrlAccess(
  target: ScanTarget,
  bucket: BucketInfo,
): Promise<Finding | null> {
  const response = await supabasePost(
    target,
    `/storage/v1/object/sign/${bucket.name}/nonexistent-test-file`,
    { expiresIn: 604800 },
  );

  if (response.status === 200 && response.data) {
    const data = response.data as Record<string, unknown>;
    const signedURL = data.signedURL ?? data.signedUrl ?? "";

    return createFinding({
      title: `Bucket "${bucket.name}" allows anonymous signed URL creation`,
      description: `Anonymous users can generate signed URLs for objects in the "${bucket.name}" bucket. This could allow attackers to create time-limited access links to private files, bypassing bucket privacy settings.`,
      severity: "high",
      category: "storage",
      resource: `storage/${bucket.name}`,
      details: {
        bucketName: bucket.name,
        bucketId: bucket.id,
        signedUrlGenerated: Boolean(signedURL),
        requestedExpiry: 604800,
      },
      remediation: `Restrict signed URL creation to authenticated users by adding a SELECT policy on storage.objects that prevents anonymous access: CREATE POLICY "auth_signed_urls" ON storage.objects FOR SELECT TO anon USING (false);`,
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

    const [
      listResults,
      writeResults,
      deleteResults,
      contentTypeResults,
      signedUrlResults,
      objectsRlsFinding,
    ] = await Promise.all([
      Promise.all(buckets.map((b) => testBucketListAccess(target, b))),
      Promise.all(buckets.map((b) => testBucketWriteAccess(target, b))),
      Promise.all(buckets.map((b) => testBucketDeleteAccess(target, b))),
      Promise.all(buckets.map((b) => checkPublicBucketContentTypes(target, b))),
      Promise.all(buckets.map((b) => checkSignedUrlAccess(target, b))),
      checkStorageObjectsRls(target),
    ]);

    const publicResults = buckets.map(checkPublicBucket);
    const restrictionResults = buckets.flatMap(checkUploadRestrictions);

    for (const finding of [
      ...listResults,
      ...writeResults,
      ...deleteResults,
      ...publicResults,
      ...contentTypeResults,
      ...signedUrlResults,
      objectsRlsFinding,
      ...restrictionResults,
    ]) {
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
