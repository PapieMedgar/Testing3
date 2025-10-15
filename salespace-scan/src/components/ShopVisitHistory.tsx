import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  User, 
  MapPin, 
  ClipboardList,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Shop } from '@/lib/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuestionAnswer {
  id: number;
  question: string;
  answer: string;
}

interface Questionnaire {
  questions: QuestionAnswer[];
}

interface ShopVisit {
  id: number;
  agent_id: number;
  agent_name?: string;
  shop_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  status: string;
  notes?: string;
  photo_path?: string;
  questionnaire?: Questionnaire;
}

interface ShopVisitHistoryProps {
  shop: Shop;
  visits: ShopVisit[];
  isLoading: boolean;
}

const ShopVisitHistory: React.FC<ShopVisitHistoryProps> = ({ shop, visits, isLoading }) => {
  const [expandedVisits, setExpandedVisits] = useState<number[]>([]);

  // Sort visits by timestamp (most recent first)
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toggleVisitExpand = (visitId: number) => {
    if (expandedVisits.includes(visitId)) {
      setExpandedVisits(expandedVisits.filter(id => id !== visitId));
    } else {
      setExpandedVisits([...expandedVisits, visitId]);
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Time', 'Agent', 'Location', 'Notes'];
    
    // Add questionnaire questions as headers
    const allQuestions = new Set<string>();
    sortedVisits.forEach(visit => {
      if (visit.questionnaire?.questions) {
        visit.questionnaire.questions.forEach(q => {
          allQuestions.add(q.question);
        });
      }
    });
    
    const questionHeaders = Array.from(allQuestions);
    const csvHeaders = [...headers, ...questionHeaders].join(',');
    
    // Create rows
    const csvRows = sortedVisits.map(visit => {
      const date = new Date(visit.timestamp);
      const dateStr = date.toLocaleDateString('en-ZA');
      const timeStr = date.toLocaleTimeString('en-ZA');
      
      // Basic data
      const row = [
        dateStr,
        timeStr,
        visit.agent_name || `Agent #${visit.agent_id}`,
        `${visit.latitude.toFixed(4)}, ${visit.longitude.toFixed(4)}`,
        `"${(visit.notes || '').replace(/"/g, '""')}"`
      ];
      
      // Add questionnaire answers
      questionHeaders.forEach(question => {
        const questionAnswer = visit.questionnaire?.questions.find(q => q.question === question);
        row.push(questionAnswer ? `"${questionAnswer.answer}"` : '');
      });
      
      return row.join(',');
    });
    
    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${shop.name.replace(/\s+/g, '_')}_visits.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading visit history...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Visit History</CardTitle>
        <CardDescription>
          All recorded visits to {shop.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedVisits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
            <p className="text-muted-foreground">This shop has not been visited yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Questionnaire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVisits.map((visit) => (
                <React.Fragment key={visit.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(visit.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{visit.agent_name || "Unknown Agent"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {visit.notes || "No notes provided"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleVisitExpand(visit.id)}
                        className="flex items-center gap-1"
                      >
                        <ClipboardList className="h-4 w-4" />
                        {expandedVisits.includes(visit.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedVisits.includes(visit.id) && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/20">
                        <div className="p-2">
                          <h4 className="font-medium mb-2">Questionnaire Responses</h4>
                          {visit.questionnaire?.questions && visit.questionnaire.questions.length > 0 ? (
                            <div className="space-y-2">
                              {visit.questionnaire.questions.map((qa) => (
                                <div key={qa.id} className="grid grid-cols-2 gap-2 border-b pb-2">
                                  <div className="font-medium text-sm">{qa.question}</div>
                                  <div className="text-sm">{qa.answer}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No questionnaire data available</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={exportToCSV} 
          disabled={sortedVisits.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopVisitHistory;