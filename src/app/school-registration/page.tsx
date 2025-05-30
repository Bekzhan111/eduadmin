'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { School, CheckCircle, AlertCircle, ArrowLeft, Building, Users, GraduationCap } from 'lucide-react';

interface SchoolRegistrationForm {
  school_name: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  school_address: string;
  school_city: string;
  school_bin: string;
  school_type: string;
  students_count: number;
  teachers_count: number;
  website: string;
  description: string;
}

export default function SchoolRegistrationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<SchoolRegistrationForm>({
    school_name: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    school_address: '',
    school_city: '',
    school_bin: '',
    school_type: '',
    students_count: 0,
    teachers_count: 0,
    website: '',
    description: ''
  });

  const handleInputChange = (field: keyof SchoolRegistrationForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.school_name.trim()) {
      setError('School name is required');
      return false;
    }
    if (!form.contact_person_name.trim()) {
      setError('Contact person name is required');
      return false;
    }
    if (!form.contact_email.trim()) {
      setError('Contact email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!form.school_type) {
      setError('Please select a school type');
      return false;
    }
    if (form.students_count < 1) {
      setError('Number of students must be at least 1');
      return false;
    }
    if (form.teachers_count < 1) {
      setError('Number of teachers must be at least 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const registrationData = {
        school_name: form.school_name.trim(),
        contact_person_name: form.contact_person_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        school_address: form.school_address.trim() || null,
        school_city: form.school_city.trim() || null,
        school_bin: form.school_bin.trim() || null,
        school_type: form.school_type,
        students_count: form.students_count,
        teachers_count: form.teachers_count,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('school_registration_requests')
        .insert([registrationData]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting school registration:', error);
      setError('Failed to submit registration request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Registration Request Submitted!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for your interest in joining our educational platform. We have received 
              your registration request for <strong>{form.school_name}</strong> and will review 
              it within 3-5 business days. You will receive an email confirmation once your 
              application is approved.
            </p>
            <div className="space-y-3">
              <Link href="/bulk-purchase">
                <Button variant="outline" className="w-full">
                  Request Bulk Purchase
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <School className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              School Registration
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join our educational platform and get access to our complete library of educational books
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-4">
              <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Institutional Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete library access for your institution
              </p>
            </Card>
            <Card className="text-center p-4">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Student Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage student access and progress
              </p>
            </Card>
            <Card className="text-center p-4">
              <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Bulk Pricing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Special pricing for educational institutions
              </p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                Please provide your school details to join our platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* School Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">School Details</h3>
                  
                  <div>
                    <Label htmlFor="school_name">School Name *</Label>
                    <Input
                      id="school_name"
                      type="text"
                      value={form.school_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="school_type">School Type *</Label>
                      <Select value={form.school_type} onValueChange={(value) => handleInputChange('school_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select school type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="high">High School</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="vocational">Vocational School</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="school_bin">Business Identification Number</Label>
                      <Input
                        id="school_bin"
                        type="text"
                        value={form.school_bin}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_bin', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="school_address">School Address</Label>
                      <Input
                        id="school_address"
                        type="text"
                        value={form.school_address}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_address', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="school_city">City</Label>
                      <Input
                        id="school_city"
                        type="text"
                        value={form.school_city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_city', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="students_count">Number of Students *</Label>
                      <Input
                        id="students_count"
                        type="number"
                        min="1"
                        value={form.students_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('students_count', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="teachers_count">Number of Teachers *</Label>
                      <Input
                        id="teachers_count"
                        type="number"
                        min="1"
                        value={form.teachers_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('teachers_count', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">School Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={form.website}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.yourschool.com"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  
                  <div>
                    <Label htmlFor="contact_person_name">Contact Person Name *</Label>
                    <Input
                      id="contact_person_name"
                      type="text"
                      value={form.contact_person_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_person_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Contact Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={form.contact_email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_email', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={form.contact_phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <Label htmlFor="description">Additional Information</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Tell us more about your school and educational needs"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration Request'}
                  </Button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    By submitting this form, you agree to be contacted regarding your registration.
                    We will review your application and respond within 3-5 business days.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 