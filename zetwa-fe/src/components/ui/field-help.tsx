/**
 * Field Help Component
 * Displays a question mark icon that opens a modal with detailed field explanation
 */

import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FieldHelpContent {
  /** Title displayed in the modal header */
  title: string
  /** Brief description shown below the title */
  description: string
  /** Detailed explanation with multiple sections */
  details?: {
    /** What this field does */
    whatItDoes?: string
    /** When to use this field */
    whenToUse?: string
    /** Example values or usage */
    examples?: string[]
    /** Important notes or warnings */
    notes?: string[]
    /** Default value if any */
    defaultValue?: string
    /** Tips for best practices */
    tips?: string[]
  }
}

interface FieldHelpProps {
  /** The help content to display */
  content: FieldHelpContent
  /** Additional class names */
  className?: string
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function FieldHelp({ content, className, size = 'sm' }: FieldHelpProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-5 w-5 rounded-full p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className={sizeMap[size]} />
          <span className="sr-only">Help for {content.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {content.details && (
          <div className="space-y-4 pt-2">
            {/* What it does */}
            {content.details.whatItDoes && (
              <Section title="Apa Fungsinya?">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.details.whatItDoes}
                </p>
              </Section>
            )}

            {/* When to use */}
            {content.details.whenToUse && (
              <Section title="Kapan Menggunakannya?">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.details.whenToUse}
                </p>
              </Section>
            )}

            {/* Default value */}
            {content.details.defaultValue && (
              <Section title="Nilai Default">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {content.details.defaultValue}
                </code>
              </Section>
            )}

            {/* Examples */}
            {content.details.examples && content.details.examples.length > 0 && (
              <Section title="Contoh">
                <ul className="space-y-1.5">
                  {content.details.examples.map((example, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs flex-1">
                        {example}
                      </code>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Tips */}
            {content.details.tips && content.details.tips.length > 0 && (
              <Section title="💡 Tips">
                <ul className="space-y-1.5">
                  {content.details.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Notes/Warnings */}
            {content.details.notes && content.details.notes.length > 0 && (
              <Section title="⚠️ Catatan Penting">
                <ul className="space-y-1.5">
                  {content.details.notes.map((note, index) => (
                    <li key={index} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  )
}

export default FieldHelp
