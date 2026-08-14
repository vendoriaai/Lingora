// UiKitPage — /dev/ui-kit. Dev-only (gated on VITE_APP_ENV in App).
// Mounts every shared/ui variant per docs/05-DESIGN-SYSTEM §2 + §10. Used by
// Playwright to snapshot base components in light + dark for regression, with
// an axe baseline of zero violations.
import {
  Search,
  Mail,
  Eye,
  Sun,
  Moon,
  Monitor,
  Bell,
  Plus,
  Trash2,
  Settings,
  User,
  LogOut,
  Info,
  AlertTriangle,
  AlertCircle,
  Mic,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@renderer/app/providers/ThemeProvider';
import {
  Button,
  IconButton,
  Card,
  Input,
  Textarea,
  Badge,
  Progress,
  ProgressRing,
  Skeleton,
  LoadingSpinner,
  Avatar,
  EmptyState,
  Alert,
  ErrorBoundary,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Slider,
  Tooltip,
  TooltipProvider,
  Select,
  SelectItem,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Dialog,
  DialogClose,
  ToastProvider,
  useToast,
} from '@renderer/shared/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-lg font-semibold text-text">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => toast({ variant: 'info', title: 'Heads up', description: 'A new course was added.' })}>
        Info
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast({ variant: 'success', title: 'Saved', description: 'Your changes are live.' })}>
        Success
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast({ variant: 'warning', title: 'Almost full', description: 'Your storage is at 90%.' })}>
        Warning
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast({ variant: 'danger', title: 'Upload failed', description: 'Check your connection and retry.' })}>
        Danger (sticky)
      </Button>
    </div>
  );
}

function CrashDemo() {
  const [crash, setCrash] = useState(false);
  if (crash) throw new Error('Simulated render error for the ErrorBoundary demo.');
  return (
    <Button size="sm" variant="danger" onClick={() => setCrash(true)}>
      Throw render error
    </Button>
  );
}

export default function UiKitPage() {
  const { theme, setTheme, resolved } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectVal, setSelectVal] = useState<string>('a1');
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <ToastProvider>
      <TooltipProvider>
        <main id="main" className="min-h-screen bg-bg p-8 text-text">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl tracking-tight">UI Kit</h1>
              <p className="text-sm text-text-muted">
                Design-system registry · resolved theme:{' '}
                <code className="text-brand-primary">{resolved}</code>
              </p>
            </div>
            <div className="flex gap-2" role="group" aria-label="Theme">
              {(['system', 'light', 'dark'] as const).map((t) => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
                return (
                  <Button
                    key={t}
                    size="sm"
                    variant={theme === t ? 'primary' : 'outline'}
                    onClick={() => setTheme(t)}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="capitalize">{t}</span>
                  </Button>
                );
              })}
            </div>
          </header>

          {/* Buttons */}
          <Section title="Buttons">
            {(['primary', 'accent', 'ai', 'ghost', 'outline', 'danger'] as const).map((v) =>
              (['sm', 'md', 'lg'] as const).map((s) => (
                <Button key={`${v}-${s}`} variant={v} size={s}>
                  {v}
                </Button>
              )),
            )}
            <Button variant="primary" loading>
              Saving
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="ai">
              <Sparkles className="size-4" aria-hidden />
              Ask AI
            </Button>
          </Section>

          {/* IconButton */}
          <Section title="IconButton">
            <IconButton aria-label="Search">
              <Search className="size-4" />
            </IconButton>
            <IconButton aria-label="Notifications" variant="outline">
              <Bell className="size-4" />
            </IconButton>
            <IconButton aria-label="Add" variant="primary">
              <Plus className="size-4" />
            </IconButton>
            <IconButton aria-label="Delete" variant="danger">
              <Trash2 className="size-4" />
            </IconButton>
            <Tooltip content="Settings">
              <IconButton aria-label="Settings" variant="ghost">
                <Settings className="size-4" />
              </IconButton>
            </Tooltip>
          </Section>

          {/* Card */}
          <Section title="Card">
            <Card title="Default card" className="w-64">
              <p className="text-sm text-text-muted">A flat bordered surface with shadow-1.</p>
            </Card>
            <Card variant="interactive" className="w-64">
              <p className="font-medium">Interactive</p>
              <p className="mt-1 text-sm text-text-muted">Hover lifts with shadow-2.</p>
            </Card>
            <Card variant="ai-tinted" className="w-64">
              <p className="font-medium">AI-tinted</p>
              <p className="mt-1 text-sm text-text-muted">Used for AI-originated content.</p>
            </Card>
          </Section>

          {/* Input */}
          <Section title="Input">
            <Input label="Email" type="email" placeholder="you@example.com" leading={<Mail className="size-4" />} />
            <Input label="Search courses" type="search" placeholder="Find a course…" leading={<Search className="size-4" />} />
            <Input label="Password" type="password" defaultValue="hunter2" trailing={<Eye className="size-4" />} />
            <Input
              label="Username"
              defaultValue="bananbenbadr"
              error="That name is taken — try another."
            />
            <Input label="Disabled" defaultValue="locked" disabled />
          </Section>

          {/* Textarea */}
          <Section title="Textarea">
            <Textarea label="Write your answer" placeholder="Describe a hobby…" showCount maxLength={280} />
            <Textarea
              label="Short bio"
              helper="Up to 200 characters."
              defaultValue="Language learner · coffee · long walks."
              error="Please add a little more detail."
            />
          </Section>

          {/* Select */}
          <Section title="Select">
            <div className="w-64">
              <Select value={selectVal} onValueChange={setSelectVal} placeholder="Pick a CEFR level">
                <SelectItem value="a1">A1 · Beginner</SelectItem>
                <SelectItem value="a2">A2 · Elementary</SelectItem>
                <SelectItem value="b1">B1 · Intermediate</SelectItem>
                <SelectItem value="b2">B2 · Upper intermediate</SelectItem>
                <SelectItem value="c1">C1 · Advanced</SelectItem>
                <SelectItem value="c2">C2 · Mastery</SelectItem>
              </Select>
            </div>
            <div className="w-48">
              <Select loading placeholder="Loading levels…" />
            </div>
          </Section>

          {/* DropdownMenu */}
          <Section title="DropdownMenu">
            <DropdownMenu
              trigger={
                <Button variant="outline">
                  <User className="size-4" aria-hidden /> Account
                </Button>
              }
            >
              <DropdownMenuLabel>bananbenbadr</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<User className="size-4" />}>Profile</DropdownMenuItem>
              <DropdownMenuItem icon={<Settings className="size-4" />}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem danger icon={<LogOut className="size-4" />}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenu>
          </Section>

          {/* Dialog */}
          <Section title="Dialog">
            <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="Start a live session?"
              description="You'll talk with the AI tutor in real time. You can end the session any time."
              footer={
                <>
                  <DialogClose>Cancel</DialogClose>
                  <Button onClick={() => setDialogOpen(false)}>Start</Button>
                </>
              }
            >
              <p className="text-sm text-text-muted">
                Choose a focus and a difficulty on the next screen.
              </p>
            </Dialog>
          </Section>

          {/* Tabs */}
          <Section title="Tabs">
            <div className="w-full max-w-md">
              <Tabs defaultValue="overview" variant="underline" fullWidth>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">Course overview content.</TabsContent>
                <TabsContent value="curriculum">Lesson-by-lesson breakdown.</TabsContent>
                <TabsContent value="reviews">What learners said.</TabsContent>
              </Tabs>
            </div>
            <div className="w-full max-w-md">
              <Tabs defaultValue="voice" variant="pill">
                <TabsList>
                  <TabsTrigger value="voice">Voice</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="vocab">Vocab</TabsTrigger>
                </TabsList>
                <TabsContent value="voice">Live voice session.</TabsContent>
                <TabsContent value="text">Text tutor chat.</TabsContent>
                <TabsContent value="vocab">Flashcards.</TabsContent>
              </Tabs>
            </div>
          </Section>

          {/* Switch */}
          <Section title="Switch">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} label="Subtitles on" />
            <Switch size="sm" />
            <Switch disabled />
          </Section>

          {/* Slider */}
          <Section title="Slider">
            <div className="w-64">
              <Slider defaultValue={[60]} min={0} max={100} showLabels minLabel="0%" maxLabel="100%" />
            </div>
            <div className="w-64">
              <Slider defaultValue={[1]} min={50} max={200} showLabels minLabel="0.5x" maxLabel="2x" />
            </div>
          </Section>

          {/* Toast */}
          <Section title="Toast">
            <ToastDemo />
          </Section>

          {/* Badge */}
          <Section title="Badge">
            {(['brand', 'neutral', 'success', 'warning', 'danger', 'outline'] as const).map((v) => (
              <Badge key={v} variant={v} dot>
                {v}
              </Badge>
            ))}
            <Badge variant="brand">B1</Badge>
            <Badge variant="success" dot>
              Online
            </Badge>
          </Section>

          {/* Progress */}
          <Section title="Progress">
            <div className="w-80">
              <Progress value={64} label="64%" />
              <div className="my-3" />
              <Progress value={undefined} label="Indeterminate" />
            </div>
            <div className="flex items-center gap-6">
              <ProgressRing value={72} label="72%" />
              <ProgressRing value={undefined} label="Loading" />
            </div>
          </Section>

          {/* Skeleton / Spinner */}
          <Section title="Skeleton · Spinner">
            <div className="flex flex-col gap-2">
              <Skeleton width={220} height={20} />
              <Skeleton width={180} height={14} />
              <Skeleton circle width={40} height={40} />
            </div>
            <LoadingSpinner size={16} />
            <LoadingSpinner size={24} />
            <LoadingSpinner size={32} />
          </Section>

          {/* Avatar */}
          <Section title="Avatar">
            <Avatar src="https://i.pravatar.cc/96?img=12" alt="Sample user" size="md" />
            <Avatar initials="BB" alt="bananbenbadr" size="md" />
            <Avatar initials="Lingora Learner" size="md" />
            <Avatar decorative size="md" />
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <Avatar key={s} initials="BB" size={s} />
            ))}
          </Section>

          {/* EmptyState */}
          <Section title="EmptyState">
            <div className="w-full max-w-md rounded-lg border border-border p-4">
              <EmptyState
                icon={<Mic className="size-6" />}
                title="No live sessions yet"
                description="Start your first voice conversation with the AI tutor."
                action={<Button variant="primary">Start a session</Button>}
              />
            </div>
            <div className="w-72 rounded-lg border border-border p-4">
              <EmptyState
                compact
                icon={<BookOpen className="size-5" />}
                title="No lessons here"
                action={<Button size="sm" variant="outline">Browse courses</Button>}
              />
            </div>
          </Section>

          {/* Alert */}
          <Section title="Alert / Banner">
            <Alert variant="info" title="Tip" icon={<Info className="size-5" />}>
              Switch to voice mode for a more immersive practice session.
            </Alert>
            <Alert variant="warning" title="Heads up" icon={<AlertTriangle className="size-5" />}>
              You have 2 lessons left in your trial.
            </Alert>
            <Alert variant="danger" title="Connection lost" icon={<AlertCircle className="size-5" />}>
              We couldn&apos;t reach the server. Please retry.
            </Alert>
          </Section>

          {/* ErrorBoundary */}
          <Section title="ErrorBoundary">
            <ErrorBoundary label="Demo boundary">
              <CrashDemo />
            </ErrorBoundary>
          </Section>

          <p className="mt-8 text-xs text-text-muted">
            Mounted {`{light, dark}`} variants of every item in docs/05 §2. Use
            the theme switch in the header to verify token resolution.
          </p>
        </main>
      </TooltipProvider>
    </ToastProvider>
  );
}
