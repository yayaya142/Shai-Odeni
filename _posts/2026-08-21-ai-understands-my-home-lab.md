---
title: "My AI Finally Understands My Home Lab"
date: 2026-08-21 09:00:00 +0300
category: homelab
subcategories:
  - observability
  - self-hosting
  - ai-agents
tags:
  - netdata
  - observability
  - mcp
  - nginx
  - opentelemetry
  - homelab
  - ai-agents
type: project-story
summary: "How I built a centralized Netdata observability hub that lets an AI agent query live home lab metrics and logs through MCP."
featured: false
image:
  path: "https://lh3.googleusercontent.com/d/1W8OUzxj_1WAkpY5Tj5p8T6gsXUTk5E48=w2000"
  alt: "Netdata dashboard for the home lab observability hub"
---

## The Goal

I wanted one place that could tell me the health of every machine that matters in my home lab, without having to jump between four separate dashboards or SSH into each box just to check a graph. On top of that, I wanted an AI assistant to be able to query that data directly  not by reading logs I copy-pasted, but by talking to the monitoring system itself.

That meant building a proper hub observability layer with [Netdata](https://www.netdata.cloud/), where one central "Parent" node collects metrics from every other server, and exposes a single secured dashboard plus an MCP endpoint an AI agent can query.

The rough shape of it looks like this:

```text
                 AI Agent 
                    |
                   MCP
                    |
              Netdata Parent 
                    |
          +---------+---------+
          |         |         |
         Dev      Media    Proxmox
        Agent     Agent     Agent
```

Home Assistant isn't in this graph  it already has its own dedicated MCP integration, so there was no reason to double up. Same story with AdGuard nothing about it is currently worth monitoring closely enough to justify the extra surface area.

## What It Actually Does

Every machine in the lab now streams its metrics, CPU, memory, disk, and network activity, into one Parent node, giving me visibility across every box at once instead of four separate tabs. That Parent is the only thing exposed on the network, sitting behind Nginx with Basic Auth, so there's exactly one door in and it's locked.

The dashboard alone would already be worth it. But the real reason I built this is the second half: **an AI can talk to it.**

![Netdata nodes dashboard showing connected home lab agents](https://lh3.googleusercontent.com/d/1YudD4gMxFuEP-J03JDznNnQGIz2Pkny6=w2000)

## Metrics an AI Can Actually Query

Netdata ships with a built-in MCP server. That means instead of me staring at graphs and describing what I see, I can just ask my AI agent  wired into it through OpenCode  to go look for itself. "Why did CPU spike on the media server last night" gets answered from live data, not from me screenshotting a chart and pasting it into a chat.

Locking that down took some care  the MCP endpoint needed its own access rule, separate from the dashboard, and its own API key. Worth it: now the only machine that can ask questions is my dev box, and everything else is closed off.

![AI-generated home lab status report from Netdata MCP data](https://lh3.googleusercontent.com/d/1-nP5HxtfcmsY-Tkq3YJViH845A6kJ2Jg=w2000)

## Then I Threw Logs In Too

A few days later I extended the same pipeline to pull Docker container logs off my media server through an OpenTelemetry Collector, straight into the same Netdata Parent. Now the AI doesn't just see *that* something spiked  it can read the actual application logs from the exact container that caused it, through the same MCP connection it already had.

Metrics and logs, one pipeline, one AI, zero manual copy-pasting.

## Why This Is Actually Cool

This isn't just "nicer dashboards." It's a home lab that can explain itself. I don't have to be the middleman between what's happening on my servers and the AI helping me debug it  the AI has eyes on the system directly, safely, and only from where it's supposed to.
