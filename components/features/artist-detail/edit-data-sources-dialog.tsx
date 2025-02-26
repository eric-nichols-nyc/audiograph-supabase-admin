"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArtistPlatformId } from '@/types/artists'
import { Edit2 } from 'lucide-react'
import { platformConfig, getAllPlatformKeys } from '@/config/platforms'

interface EditDataSourcesDialogProps {
  platformIds: ArtistPlatformId[];
  artistId: string;
  trigger?: React.ReactNode;
}

export function EditDataSourcesDialog({ 
  platformIds, 
  artistId,
  trigger
}: EditDataSourcesDialogProps) {
  const [open, setOpen] = React.useState(false)
  
  // Get all platform keys
  const allPlatforms = getAllPlatformKeys();
  
  // Get connected platforms
  const connectedPlatforms = platformIds.map(p => p.platform);
  
  // Get missing platforms
  const missingPlatforms = allPlatforms.filter(p => !connectedPlatforms.includes(p));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit data sources</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Sources</DialogTitle>
          <DialogDescription>
            Add or update platform IDs for this artist. These IDs are used to link to external platforms.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Accordion type="single" collapsible defaultValue="connected" className="w-full">
            {/* Connected Platforms */}
            <AccordionItem value="connected">
              <AccordionTrigger className="text-base font-medium">
                Connected Platforms ({connectedPlatforms.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-2">
                  {platformIds.map((platform) => {
                    const config = platformConfig[platform.platform as keyof typeof platformConfig];
                    return (
                      <div key={platform.platform} className="space-y-2">
                        <Label htmlFor={`platform-${platform.platform}`} className="flex items-center gap-2">
                          {config?.name || platform.platform}
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            id={`platform-${platform.platform}`}
                            defaultValue={platform.platform_id}
                            placeholder={config?.placeholder || `Enter ${platform.platform} ID`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Missing Platforms */}
            <AccordionItem value="missing">
              <AccordionTrigger className="text-base font-medium">
                Missing Platforms ({missingPlatforms.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-2">
                  {missingPlatforms.map((platform) => {
                    const config = platformConfig[platform];
                    return (
                      <div key={platform} className="space-y-2">
                        <Label htmlFor={`platform-${platform}`} className="flex items-center gap-2">
                          {config?.name || platform}
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            id={`platform-${platform}`}
                            placeholder={config?.placeholder || `Enter ${platform} ID`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 