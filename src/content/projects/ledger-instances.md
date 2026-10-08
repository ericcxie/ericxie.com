---
title: "Ledger Instances"
company: "Wat Street"
role: "Backend Developer"
timeline: "Jan – Aug 2025"
description: "Isolated paper-trading ledgers that let every trading algorithm be forward tested on live prices."
tools: ["Flask", "SQLAlchemy", "PostgreSQL", "Docker"]
figure: "plot"
link: "https://github.com/Wat-Street/ledger-instances"
order: 5
featured: true
---

## Background

Wat Street is a quantitative finance design team at Waterloo where students build and test their own trading algorithms. A strategy can look great in a backtest and still fall apart once it meets new data, so before trusting one, you want to forward test it: let it trade on live prices as they come in and see how it actually holds up. I joined as a backend developer to build that.

## Building it

I built ledger instances that each track a strategy's paper trades, positions and balance over time, so every algorithm runs against its own isolated account. The backend is a Flask API with SQLAlchemy on top of Postgres, and everything runs in Docker, which made it easy to spin up instances and keep everyone's setup the same.
