'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Eye, Lock, Database, UserCheck, Clock } from 'lucide-react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

export function PrivacyPolicyModal({
  open,
  onOpenChange,
  companyName = 'Our Organization',
}: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            Privacy Policy & Data Protection
          </DialogTitle>
          <DialogDescription>
            How we collect, use, and protect your personal information
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Data Collection */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-base">What Data We Collect</h3>
              </div>
              <div className="pl-6 space-y-2">
                <p><strong>Personal Information:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                  <li>Name and email address</li>
                  <li>Job title and department</li>
                  <li>Work location and contact information</li>
                </ul>
                
                <p className="mt-3"><strong>Demographic Information (Optional):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                  <li>Gender identity (if you choose to share)</li>
                  <li>Education level</li>
                  <li>Years of experience</li>
                  <li>Team size and reporting structure</li>
                </ul>
                
                <p className="mt-3"><strong>Survey Responses:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                  <li>Your answers to organizational climate surveys</li>
                  <li>Feedback and comments (when provided)</li>
                  <li>Response timestamps and completion data</li>
                </ul>
              </div>
            </section>

            {/* How We Use Data */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-base">How We Use Your Data</h3>
              </div>
              <div className="pl-6 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Organizational Analysis:</strong> To understand workplace climate and culture patterns</li>
                  <li><strong>Reporting:</strong> To create aggregated reports that help improve workplace conditions</li>
                  <li><strong>Benchmarking:</strong> To compare results across departments and time periods</li>
                  <li><strong>Action Planning:</strong> To develop targeted improvement initiatives</li>
                  <li><strong>System Administration:</strong> To manage user accounts and survey access</li>
                </ul>
                
                <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-green-800 font-medium">Important:</p>
                  <p className="text-green-700">
                    Individual responses are never shared with managers or colleagues. 
                    All analysis is performed on aggregated, anonymized data.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-base">How We Protect Your Data</h3>
              </div>
              <div className="pl-6 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Encryption:</strong> All data is encrypted both in transit and at rest</li>
                  <li><strong>Access Control:</strong> Only authorized personnel can access personal data</li>
                  <li><strong>Anonymization:</strong> Survey responses are anonymized for analysis</li>
                  <li><strong>Secure Infrastructure:</strong> Data is stored on secure, compliant cloud platforms</li>
                  <li><strong>Regular Audits:</strong> We conduct regular security assessments and updates</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-base">Your Rights (GDPR)</h3>
              </div>
              <div className="pl-6 space-y-2">
                <p>Under GDPR and other privacy laws, you have the right to:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                  <li><strong>Rectification:</strong> Correct any inaccurate or incomplete information</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                </ul>
                
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-blue-800 font-medium">To exercise your rights:</p>
                  <p className="text-blue-700">
                    Contact your system administrator or privacy officer. 
                    We will respond to all requests within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-base">Data Retention</h3>
              </div>
              <div className="pl-6 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>User Accounts:</strong> Retained while you are an active employee</li>
                  <li><strong>Survey Responses:</strong> Retained for 5 years for longitudinal analysis</li>
                  <li><strong>Demographic Data:</strong> Retained for 5 years or until deletion requested</li>
                  <li><strong>Audit Logs:</strong> Retained for 7 years for compliance purposes</li>
                </ul>
                
                <p className="mt-2 text-gray-600">
                  When you leave the organization or request data deletion, 
                  we will either delete your data or anonymize it for continued analysis, 
                  based on your preferences and legal requirements.
                </p>
              </div>
            </section>

            {/* Third Parties */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-base">Third Party Sharing</h3>
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-gray-600">
                  We do not sell, trade, or share your personal information with third parties, except:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>When required by law or legal process</li>
                  <li>With your explicit consent</li>
                  <li>With trusted service providers who help us operate the platform (under strict confidentiality agreements)</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-base">Contact Us</h3>
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-gray-600">
                  If you have questions about this privacy policy or how we handle your data:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Contact your system administrator</li>
                  <li>Email: privacy@{companyName.toLowerCase().replace(/\s+/g, '')}.com</li>
                  <li>Or use the help section in your dashboard</li>
                </ul>
              </div>
            </section>

            {/* Updates */}
            <section className="space-y-3 border-t pt-4">
              <p className="text-xs text-gray-500">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                We may update this privacy policy from time to time. 
                We will notify you of any significant changes via email or platform notification.
              </p>
            </section>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
