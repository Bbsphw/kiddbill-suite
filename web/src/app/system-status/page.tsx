"use client";

import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HealthResponse = {
  status: string;
  services: {
    database: string;
    redis: string;
    sentry: string;
  };
  issues: string[];
  message: string;
  timestamp: string;
  version: string;
};

export default function SystemStatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== "sentry-unreachable");
    }
    checkConnectivity();
    fetchHealth();
    // Refresh every 5 seconds
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status?: string) => {
    if (loading && !status) return <Badge variant="secondary">Checking...</Badge>;
    if (status === "ok" || status === "enabled")
      return <Badge className="bg-green-500 hover:bg-green-600">Operational</Badge>;
    if (status === "disabled")
      return <Badge variant="secondary">Disabled</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            Real-time status of Kiddbill Suite enterprise services.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchHealth();
            Sentry.logger.info("Admin manually refreshed system status");
          }}
        >
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Backend Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>NestJS Backend API</span>
              {getStatusBadge(health?.status)}
            </CardTitle>
            <CardDescription>Core logic and routing engine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-medium">{health?.version || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Ping:</span>
                <span className="font-medium">
                  {health ? new Date(health.timestamp).toLocaleTimeString() : "Disconnected"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>PostgreSQL Database</span>
              {getStatusBadge(health?.services?.database)}
            </CardTitle>
            <CardDescription>Prisma ORM Connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">Relational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Message:</span>
                <span className="font-medium">
                  {health?.services?.database === "ok" ? "Connected" : "Connection Refused"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redis Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Redis & BullMQ</span>
              {getStatusBadge(health?.services?.redis)}
            </CardTitle>
            <CardDescription>Background Job Processor (Upstash)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Queue:</span>
                <span className="font-medium">ocr-queue</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worker Status:</span>
                <span className="font-medium">
                  {health?.services?.redis === "ok" ? "Ready" : "Offline"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentry Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Sentry Observability</span>
              {getStatusBadge(isConnected ? (health?.services?.sentry || "ok") : "error")}
            </CardTitle>
            <CardDescription>Error Tracking & Monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Connectivity:</span>
                <span className="font-medium">{isConnected ? "Reachable" : "Blocked by Ad-blocker"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server Configuration:</span>
                <span className="font-medium">{health?.services?.sentry || "Unknown"}</span>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full mt-4"
              onClick={() => {
                Sentry.logger.info("Admin tested Sentry integration");
                throw new Error("Kiddbill System Diagnostics - Test Error");
              }}
              disabled={!isConnected}
            >
              Test Force Sentry Error
            </Button>
          </CardContent>
        </Card>
      </div>

      {health?.issues && health.issues.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-red-600 dark:text-red-400">
              {health.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
