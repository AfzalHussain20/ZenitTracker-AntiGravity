
"use client";

import { Hand, Landmark, Code, Heart, Shield, FileText, GitBranch, Rocket, Feather, Wand2, WifiOff, ArrowLeft } from "lucide-react";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Get the app version from package.json
import packageJson from '../../../../package.json';

const OfflineStatusAlert = () => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        if(typeof navigator !== 'undefined'){
            setIsOffline(!navigator.onLine);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) {
        return null;
    }

    return (
        <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
            <WifiOff className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-bold">You are currently offline.</AlertTitle>
            <AlertDescription className="text-primary/90">
                You are viewing a cached version of this page. If you can see this message, the PWA's offline capabilities are working correctly!
            </AlertDescription>
        </Alert>
    );
};


export default function AboutPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto py-8 px-4 space-y-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
       <motion.div variants={itemVariants} className="flex justify-start mb-4">
         <Button variant="outline" onClick={() => router.back()}>
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back
         </Button>
       </motion.div>

       <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">About Zenit Tracker</h1>
        <p className="mt-2 text-lg text-muted-foreground">The story behind the precision.</p>
        <Badge variant="outline" className="mt-4">Version {packageJson.version}</Badge>
      </motion.div>

      <motion.div variants={itemVariants}>
        <OfflineStatusAlert />
      </motion.div>

      <div className="space-y-8">
        {/* Our Story */}
        <motion.div variants={itemVariants} className="p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4"><Hand className="text-primary"/> Our Story</h2>
          <p className="text-foreground/90 leading-relaxed">
            This application was created and engineered by <strong className="font-semibold text-primary">Afzal Hussain</strong>, inspired by the robust functionality of MTC Medusa Testing Client, an internal tool at Microsoft. While the industry moves towards complex systems, we saw a persistent need for a streamlined, powerful tool that embraces the simplicity and universality of Excel.
          </p>
          <p className="mt-4 text-foreground/90 leading-relaxed">
            Zenit Tracker was born from this vision: to provide an intuitive platform where test cases can be imported, executed, and tracked with professional precision, bridging the gap between traditional workflows and modern efficiency.
          </p>
        </motion.div>
        
        {/* CleverTap Feature */}
        <motion.div variants={itemVariants} className="p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4"><Wand2 className="text-primary"/> CleverTap Event Tracker</h2>
          <p className="text-foreground/90 leading-relaxed">
            A key feature of Zenit Tracker is the specialized **CleverTap Event Tracker**. This guided wizard was designed to solve a common pain point: the manual, error-prone process of formatting event data for analytics platforms.
          </p>
          <p className="mt-4 text-foreground/90 leading-relaxed">
            By providing a structured interface for different content and event types, it allows testers to input raw HTML data, which the application then intelligently parses and transforms into a perfectly structured, multi-sheet Excel export. This ensures data consistency and dramatically speeds up the validation process for analytics tracking.
          </p>
        </motion.div>


        {/* Our Vision */}
        <motion.div variants={itemVariants} className="p-6 bg-card rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4"><Rocket className="text-primary"/> Our Vision</h2>
            <p className="text-foreground/90 leading-relaxed">
                Our journey is just beginning. We are actively developing new features to further revolutionize the QA process. Soon, we plan to launch a groundbreaking module that will leverage AI to automatically generate and execute test cases, saving countless hours and elevating the quality of software testing.
            </p>
        </motion.div>

        {/* Feature Documentation */}
        <motion.div variants={itemVariants} className="p-6 bg-card rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4"><FileText className="text-primary"/> Core Features</h2>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Secure Authentication</AccordionTrigger>
                    <AccordionContent>
                    Secure sign-up and login with email/password or Google, with registration restricted to a specific domain for added security.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                    <AccordionTrigger>Dynamic Dashboard</AccordionTrigger>
                    <AccordionContent>
                    An intelligent, animated dashboard provides a central hub for all testing activities, including overall test results, active and completed session lists, and a one-click export for all data.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>New Session Wizard</AccordionTrigger>
                    <AccordionContent>
                    A step-by-step process to create new test sessions. Select a platform, fill in environment details, and import test cases from an Excel file. The app validates the file and shows a preview before you begin.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Interactive Test Execution</AccordionTrigger>
                    <AccordionContent>
                    A clean, focused interface for running through test cases one by one. Mark cases as Pass, Fail (with a detailed failure log), or N/A. Notes and actual results are saved automatically.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>Professional Excel Export</AccordionTrigger>
                    <AccordionContent>
                    Generate a beautifully styled, multi-sheet Excel report with color-coded results, frozen panes, and auto-filtering. The report is designed for excellent readability and is perfect for sharing with stakeholders.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-6">
                    <AccordionTrigger>Progressive Web App (PWA)</AccordionTrigger>
                    <AccordionContent>
                    Zenit Tracker is an installable PWA with offline capabilities, allowing it to be added to a desktop or mobile home screen for an app-like experience, even without an internet connection.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </motion.div>

        {/* Acknowledgments */}
        <motion.div variants={itemVariants} className="p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4"><Heart className="text-primary"/> Acknowledgments</h2>
          <p className="text-foreground/90 leading-relaxed">
            This project would not have been possible without the phenomenal capabilities of modern technology and the platforms that support creators. A heartfelt thank you to:
          </p>
          <ul className="mt-4 space-y-3 list-inside">
            <li className="flex items-start gap-3">
              <Code className="h-5 w-5 mt-1 text-primary shrink-0"/>
              <div><strong className="font-semibold">Google Gemini, Firebase Studio, and ChatGPT</strong> for their indispensable roles in code generation and problem-solving, which dramatically accelerated development.</div>
            </li>
            <li className="flex items-start gap-3">
              <GitBranch className="h-5 w-5 mt-1 text-primary shrink-0"/>
              <div><strong className="font-semibold">GitHub</strong> for providing the world's leading platform for code hosting and version control.</div>
            </li>
            <li className="flex items-start gap-3">
              <Rocket className="h-5 w-5 mt-1 text-primary shrink-0"/>
              <div><strong className="font-semibold">Vercel & Netlify</strong> for their seamless, powerful, and developer-friendly deployment platforms.</div>
            </li>
             <li className="flex items-start gap-3">
              <Feather className="h-5 w-5 mt-1 text-primary shrink-0"/>
              <div><strong className="font-semibold">Visual Studio Code</strong> for being the most versatile and efficient code editor available.</div>
            </li>
          </ul>
        </motion.div>
        
        {/* Legal Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Privacy Policy */}
            <Dialog>
                <DialogTrigger asChild>
                    <div className="p-6 bg-card rounded-lg shadow-md cursor-pointer hover:bg-muted transition-colors">
                        <h2 className="text-2xl font-semibold flex items-center gap-3 mb-2"><Shield className="text-primary"/> Privacy Policy</h2>
                        <p className="text-sm text-muted-foreground">Read our data collection and usage policy.</p>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-foreground/80 max-h-[60vh] overflow-y-auto pr-4">
                        <p>Zenit Tracker is a testing and portfolio application. We are committed to protecting your privacy. This policy outlines our data handling practices.</p>
                        <p><strong className="font-medium text-foreground/90">Data Collection:</strong> We collect user data such as name and email for authentication purposes. Test session data, including test cases and results, is stored to provide the core functionality of the application.</p>
                        <p><strong className="font-medium text-foreground/90">Data Usage:</strong> Your data is used solely to power the features of Zenit Tracker and is not shared with third parties for marketing purposes.</p>
                        <p><strong className="font-medium text-foreground/90">Data Security:</strong> We rely on Google Firebase's robust security measures to protect your data.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Terms of Service */}
             <Dialog>
                <DialogTrigger asChild>
                    <div className="p-6 bg-card rounded-lg shadow-md cursor-pointer hover:bg-muted transition-colors">
                        <h2 className="text-2xl font-semibold flex items-center gap-3 mb-2"><FileText className="text-primary"/> Terms of Service</h2>
                        <p className="text-sm text-muted-foreground">Understand the terms of using our app.</p>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-foreground/80 max-h-[60vh] overflow-y-auto pr-4">
                        <p>By using Zenit Tracker, you agree to these terms. This application is provided "as-is" without any warranties. You are responsible for the data you upload and the actions you perform within the app. We are not liable for any data loss or damages that may arise from your use of this service.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Third-Party Services */}
             <Dialog>
                <DialogTrigger asChild>
                    <div className="p-6 bg-card rounded-lg shadow-md cursor-pointer hover:bg-muted transition-colors">
                        <h2 className="text-2xl font-semibold flex items-center gap-3 mb-2"><Landmark className="text-primary"/> Third-Party Services</h2>
                         <p className="text-sm text-muted-foreground">Learn about the services we rely on.</p>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Third-Party Services</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-foreground/80 max-h-[60vh] overflow-y-auto pr-4">
                        <p>This application is built upon and utilizes several third-party services, including but not limited to Google Firebase for backend infrastructure and authentication. Your use of this app is also subject to the terms and privacy policies of these respective services.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>

      </div>
    </motion.div>
  );
}
