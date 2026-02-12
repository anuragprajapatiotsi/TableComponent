"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSemantic } from "@/context/SemanticContext";

interface JoinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export default function JoinDialog({
  isOpen,
  onClose,
  sourceTable,
  sourceColumn,
  targetTable,
  targetColumn,
}: JoinDialogProps) {
  const { addJoin } = useSemantic();
  const [joinType, setJoinType] = useState("inner");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setJoinType("inner");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await addJoin(
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
        joinType,
      );
      onClose();
    } catch (error) {
      console.error("Failed to create join:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Join</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4 items-center text-sm">
            <div className="font-semibold text-right">{sourceTable}</div>
            <div className="text-muted-foreground">{sourceColumn}</div>
          </div>

          <div className="flex justify-center my-2">
            <div className="h-px w-full bg-border relative top-3"></div>
            <span className="bg-background px-2 text-xs text-muted-foreground relative z-10">
              JOINS WITH
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center text-sm">
            <div className="font-semibold text-right">{targetTable}</div>
            <div className="text-muted-foreground">{targetColumn}</div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4 mt-4">
            <Label htmlFor="join-type" className="text-right">
              Type
            </Label>
            <Select value={joinType} onValueChange={setJoinType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select join type" />
              </SelectTrigger>
              <SelectContent className="z-[10001]">
                <SelectItem value="inner">Inner Join</SelectItem>
                <SelectItem value="left">Left Join</SelectItem>
                <SelectItem value="right">Right Join</SelectItem>
                <SelectItem value="full">Full Outer Join</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
