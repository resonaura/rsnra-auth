import {
  CopyIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
} from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { PageShell } from '@/components/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import {
  adminDeleteUser,
  adminListUsers,
  adminUpdateUser,
  type AdminUser,
} from '@/lib/admin-api';
import {
  adminCreateOAuthClient,
  adminDeleteOAuthClient,
  adminListOAuthClients,
  adminRegenerateOAuthClientSecret,
  type OAuthClient,
  type OAuthClientWithSecret,
} from '@/lib/oauth-api';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/lib/use-document-title';

type PendingUserDelete = { id: string; email: string };
type PendingClientDelete = { id: string; name: string };

export function AdminPage() {
  useDocumentTitle('Admin');
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [clients, setClients] = React.useState<OAuthClient[] | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [pendingUserDelete, setPendingUserDelete] =
    React.useState<PendingUserDelete | null>(null);
  const [pendingClientDelete, setPendingClientDelete] =
    React.useState<PendingClientDelete | null>(null);

  const loadUsers = React.useCallback(() => {
    return adminListUsers()
      .then(setUsers)
      .catch(error => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to load users'
        );
      });
  }, []);

  const loadClients = React.useCallback(() => {
    return adminListOAuthClients()
      .then(setClients)
      .catch(error => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Failed to load OAuth clients'
        );
      });
  }, []);

  React.useEffect(() => {
    if (isAuthLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    void loadUsers();
    void loadClients();
  }, [isAuthLoading, user, navigate, loadUsers, loadClients]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleRoleChange = async (
    target: AdminUser,
    role: 'user' | 'admin'
  ) => {
    try {
      await adminUpdateUser(target.id, { role });
      toast.success(`${target.email} is now ${role}`);
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Failed to update role'
      );
    }
  };

  const handleConfirmUserDelete = async () => {
    if (!pendingUserDelete) return;
    setIsBusy(true);
    try {
      await adminDeleteUser(pendingUserDelete.id);
      toast.success(`Deleted ${pendingUserDelete.email}`);
      setPendingUserDelete(null);
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Failed to delete user'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmClientDelete = async () => {
    if (!pendingClientDelete) return;
    setIsBusy(true);
    try {
      await adminDeleteOAuthClient(pendingClientDelete.id);
      toast.success(`Deleted ${pendingClientDelete.name}`);
      setPendingClientDelete(null);
      await loadClients();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to delete OAuth client'
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PageShell title="Admin" maxWidth="max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <ShieldIcon className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-sm">
          Manage shared rsnra users, roles, and OAuth clients.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="clients">OAuth Clients</TabsTrigger>
        </TabsList>

        {/* ── Users tab ─────────────────────────────────────────── */}
        <TabsContent value="users">
          {users === null ? (
            <div className="flex justify-center py-10">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Display name
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(target => (
                  <TableRow key={target.id}>
                    <TableCell className="max-w-32 truncate font-medium sm:max-w-none">
                      {target.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {target.displayName ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={target.role}
                        onValueChange={value =>
                          handleRoleChange(target, value as 'user' | 'admin')
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">user</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(target.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        disabled={target.id === user.id}
                        onClick={() =>
                          setPendingUserDelete({
                            id: target.id,
                            email: target.email,
                          })
                        }
                      >
                        <TrashIcon className="size-4" />
                        <span className="sr-only">Delete user</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ── OAuth Clients tab ─────────────────────────────────── */}
        <TabsContent value="clients">
          <div className="mb-4 flex justify-end">
            <CreateClientDialog onCreated={() => void loadClients()} />
          </div>

          {clients === null ? (
            <div className="flex justify-center py-10">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No OAuth clients yet. Create one to enable SSO for a service.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Redirect URIs
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <code className="text-muted-foreground text-xs">
                        {client.clientId}
                      </code>
                    </TableCell>
                    <TableCell className="hidden max-w-xs sm:table-cell">
                      <div className="flex flex-col gap-1">
                        {client.redirectUris.map(uri => (
                          <code
                            key={uri}
                            className="text-muted-foreground truncate text-xs"
                          >
                            {uri}
                          </code>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.isFirstParty ? 'default' : 'secondary'}
                      >
                        {client.isFirstParty ? '1st-party' : '3rd-party'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <RegenerateSecretDialog
                          client={client}
                          onRegenerated={() => void loadClients()}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() =>
                            setPendingClientDelete({
                              id: client.id,
                              name: client.name,
                            })
                          }
                        >
                          <TrashIcon className="size-4" />
                          <span className="sr-only">Delete client</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Delete user dialog ────────────────────────────────── */}
      <Dialog
        open={pendingUserDelete !== null}
        onOpenChange={open => !open && setPendingUserDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingUserDelete?.email}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the shared rsnra account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmUserDelete}
              disabled={isBusy}
            >
              {isBusy && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete client dialog ──────────────────────────────── */}
      <Dialog
        open={pendingClientDelete !== null}
        onOpenChange={open => !open && setPendingClientDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingClientDelete?.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the OAuth client. Services using it will
              no longer be able to authenticate users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmClientDelete}
              disabled={isBusy}
            >
              {isBusy && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ── Create client dialog ──────────────────────────────────────────

function CreateClientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [clientId, setClientId] = React.useState('');
  const [name, setName] = React.useState('');
  const [redirectUrisText, setRedirectUrisText] = React.useState('');
  const [firstParty, setFirstParty] = React.useState('true');
  const [privacyUrl, setPrivacyUrl] = React.useState('');
  const [termsUrl, setTermsUrl] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [created, setCreated] = React.useState<OAuthClientWithSecret | null>(
    null
  );

  const reset = () => {
    setClientId('');
    setName('');
    setRedirectUrisText('');
    setFirstParty('true');
    setPrivacyUrl('');
    setTermsUrl('');
    setCreated(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirectUris = redirectUrisText
      .split('\n')
      .map(uri => uri.trim())
      .filter(Boolean);

    if (redirectUris.length === 0) {
      toast.error('At least one redirect URI is required');
      return;
    }

    setIsSaving(true);
    try {
      const result = await adminCreateOAuthClient({
        clientId,
        name,
        redirectUris,
        firstParty,
        privacyUrl: privacyUrl || undefined,
        termsUrl: termsUrl || undefined,
      });
      setCreated(result);
      toast.success(`Created OAuth client "${result.name}"`);
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to create OAuth client'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySecret = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.clientSecret);
    toast.success('Client secret copied to clipboard');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon className="size-4" />
        New client
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Client created</DialogTitle>
              <DialogDescription>
                Copy the client secret now — it won't be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Client ID</Label>
                <code className="bg-muted rounded px-3 py-2 text-sm">
                  {created.clientId}
                </code>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Client secret</Label>
                <div className="flex gap-2">
                  <code className="bg-muted flex-1 truncate rounded px-3 py-2 text-sm">
                    {created.clientSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button />}>Done</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>New OAuth client</DialogTitle>
              <DialogDescription>
                Register a service so it can use RSNRA Auth for SSO.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="e.g. rsnra-link"
                  required
                  maxLength={128}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. rsnra.link"
                  required
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="redirectUris">
                  Redirect URIs (one per line)
                </Label>
                <Textarea
                  id="redirectUris"
                  value={redirectUrisText}
                  onChange={e => setRedirectUrisText(e.target.value)}
                  placeholder="http://localhost:3000/auth/callback&#10;https://rsnra.link/auth/callback"
                  required
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={firstParty}
                  onValueChange={value => setFirstParty(value ?? 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      First-party (auto-approve)
                    </SelectItem>
                    <SelectItem value="false">Third-party (consent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="privacyUrl">
                  Privacy Policy URL (optional)
                </Label>
                <Input
                  id="privacyUrl"
                  type="url"
                  value={privacyUrl}
                  onChange={e => setPrivacyUrl(e.target.value)}
                  placeholder="https://rsnra.link/privacy"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="termsUrl">Terms of Use URL (optional)</Label>
                <Input
                  id="termsUrl"
                  type="url"
                  value={termsUrl}
                  onChange={e => setTermsUrl(e.target.value)}
                  placeholder="https://rsnra.link/terms"
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2Icon className="size-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Regenerate secret dialog ──────────────────────────────────────

function RegenerateSecretDialog({
  client,
  onRegenerated,
}: {
  client: OAuthClient;
  onRegenerated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [secret, setSecret] = React.useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsBusy(true);
    try {
      const result = await adminRegenerateOAuthClientSecret(client.id);
      setSecret(result.clientSecret);
      toast.success('Secret regenerated');
      onRegenerated();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to regenerate secret'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        setOpen(value);
        if (!value) setSecret(null);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <KeyRoundIcon className="size-4" />
        <span className="sr-only">Regenerate secret</span>
      </DialogTrigger>
      <DialogContent>
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>New secret for {client.name}</DialogTitle>
              <DialogDescription>
                Copy the new secret now — it won't be shown again. The old
                secret is no longer valid.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <code className="bg-muted flex-1 truncate rounded px-3 py-2 text-sm">
                {secret}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <DialogFooter>
              <DialogClose render={<Button />}>Done</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Regenerate secret for {client.name}?</DialogTitle>
              <DialogDescription>
                The current secret will stop working immediately. Any service
                using it will need to be updated with the new secret.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleRegenerate}
                disabled={isBusy}
              >
                {isBusy && <Loader2Icon className="size-4 animate-spin" />}
                Regenerate
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AdminPage;
