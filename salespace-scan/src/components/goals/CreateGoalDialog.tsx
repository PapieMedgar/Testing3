import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { goalAPI } from "@/lib/api";
import { toast } from "sonner";

interface CreateGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  managers: { id: number; phone: string; }[];
  agents: { id: number; phone: string; }[];
  onGoalCreated: () => void;
}

export function CreateGoalDialog({ 
  isOpen, 
  onClose, 
  managers, 
  agents,
  onGoalCreated 
}: CreateGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState("individual_visits");
  const [targetValue, setTargetValue] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurringType, setRecurringType] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  
  const handleSubmit = async () => {
    if (!title || !targetValue || !assigneeId || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await goalAPI.createGoal({
        title,
        description,
        goal_type: goalType,
        target_value: parseInt(targetValue),
        assignee_id: parseInt(assigneeId),
        user_id: parseInt(assigneeId), // Set user_id to the same as assignee_id
        start_date: startDate,
        end_date: endDate,
        recurring_type: recurringType,
        region: null,
        shop_id: null
      });

      toast.success("Goal created successfully!");
      onGoalCreated();
      handleClose();
    } catch (error) {
      toast.error("Failed to create goal");
      console.error(error);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setGoalType("individual_visits");
    setTargetValue("");
    setAssigneeId("");
    setStartDate("");
    setEndDate("");
    setRecurringType("none");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Set performance targets for team members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goalTitle">Goal Title *</Label>
            <Input
              id="goalTitle"
              placeholder="Enter goal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goalDescription">Description</Label>
            <Input
              id="goalDescription"
              placeholder="Goal description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalType">Type *</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_visits">Individual Visits</SelectItem>
                  <SelectItem value="shop_visits">Shop Visits</SelectItem>
                  <SelectItem value="daily_visits">Daily Visits</SelectItem>
                  <SelectItem value="weekly_visits">Weekly Visits</SelectItem>
                  <SelectItem value="monthly_visits">Monthly Visits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalTarget">Target *</Label>
              <Input
                id="goalTarget"
                type="number"
                placeholder="Target value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goalAssignee">Assign To *</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    Manager: {manager.phone}
                  </SelectItem>
                ))}
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    Agent: {agent.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurringType">Recurring *</Label>
            <Select 
              value={recurringType} 
              onValueChange={(value: "none" | "daily" | "weekly" | "monthly") => setRecurringType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Recurrence</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
