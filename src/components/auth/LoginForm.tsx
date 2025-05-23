
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const authSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const LoginForm = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { signIn, signUp } = useAuthStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'signin') {
        await signIn(values.email, values.password);
        toast({
          title: 'Success',
          description: 'Signed in successfully',
        });
      } else {
        await signUp(values.email, values.password);
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Authentication failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ZAMC-Web</h1>
          <p className="text-blue-200">Marketing & Strategy Dashboard</p>
        </div>
        
        <Card className="border-white/20 bg-black/20 backdrop-blur-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-blue-200">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="signin" 
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="signin" 
                  className="text-white data-[state=active]:bg-white data-[state=active]:text-blue-900"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-white data-[state=active]:bg-white data-[state=active]:text-blue-900"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <TabsContent value="signin" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Create a password"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
