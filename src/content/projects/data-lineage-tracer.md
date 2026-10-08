---
title: "Data Lineage Tracer"
company: "Amazon"
role: "Software Engineer Intern"
timeline: "May – Aug 2026"
description: "A tracer that maps where our tax data ends up after it leaves our service, one field at a time."
tools: ["Step Functions", "Lambda", "Bedrock"]
figure: "branches"
order: 1
featured: true
---

## Background

My team at Amazon owns a lot of tax data that other services depend on. That's fine until we want to change something. Before changing a field, we need to know who actually uses it, and there wasn't an easy way to find out besides asking every team.

## Building it

I built a tracer that finds everywhere a field is used and what it's used for. The tricky part is that a lot of services copy our fields into their own models under new names, and every team does it differently. So instead of writing a rule for each pattern, an LLM spots the renames and works out whether each use filters, displays, calculates or saves the field. If a service saves it, the tracer follows it to whoever reads that data next.

## What's next

If I kept working on it, I'd add a human in the loop, since the LLM won't always get it right. When the tracer flags something it isn't sure about, or gets a use wrong, someone could review it and fix the label. Those corrections would go into a knowledge base the model learns from, so the tracer gets more accurate the more it's used.
