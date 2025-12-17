---
layout: post
title: "A Month of using NixOS."
date: 2025-12-15 17:00:00 -0000
tags: [linux, nixos, productivity]
---

# Nix/NixOS
Some basic terminology, Nix is a package manager, a way to install software. Similar to yay, apt or homebrew. 

However it focuses on reproducible builds - to avoid being overly technical - if it works on my hardware it should work on yours. It's also worth noting nix has more packages than any other software manager so regardless of your os/platform you should consider using it.

NixOS is a linux based OS taking this to it's logical conclusion, it focuses on reproduciblilty, atomic rollbacks and overall stability.

---

# Why NixOS?
In terms of importance I think minimal potential downtime is the most important thing in a system, I want it to be the case that if my computer is physically destroyed then the outcome will be


1. less than 6 hours downtime
2. less than one day of data loss


This to me is similar to getting a yearly flu jab[^1] in that even though it might seem annoying the gains far outweigh the cost. Learning nix might be more complex than most distros but most of this cost is upfront. As is the cost of rsync and a nas, meaning if I only need to restore from back ups once in my life it'll be worth it from both a time and effort perspective. 

Though this post isn't about my workflow the basics is rsync my entire home directory then git to manage my /etc/nixos/*

Put me on any computer in the world and all I have to do is install nixos, git clone my configs, run a single command, setup rsync pull my latest /home/* backup and then I have complete parity - as in if I did this on a second computer you would not be able to tell the difference, excluding the hardware it's 1:1, no need to login to websites again, change around settings, remember what software I had installed or how it was configured.

[^1]: The average person loses 5-7 days of productivity to the flu, if you go outside you're almost guarenteed to get it each year and the flu jab is exceptionally safe and usually results in 1 day of productivity loss (if that)


# Learning Curve
As I said previously the learning curve on nixOS is steeper than other operating systems and it has a lot of terminology and inter operating parts that I'm not certain I completely understand. 

Not only that but because of it's nature basic things like setting up nvim or lazyvim are far more complex. Using just a regular package manager on nvim is incredibly difficult. I settled for having a minimal nvim config (relative line numbers, yank to system clipboard) then resorted to nixCats for something similar to lazyvim (though this took me about 4 days to get to the point of working).

I'm pretty comfortable configuring my system and installing/uninstalling software I even setup an overlay to allow me to bypass nixpkgs for railway-wallet (the version in nixpkgs is often out of date, I made a pull request to update it that has yet to be merged[^2]), this allows me to keep it up to date on my own. 

[^2]: At the time of posting it has still not been merged and is also out of date.


# Good, bad and the ugly
## The Good
There is a lot to like about NixOS (and since nix is also a package manager you can get some of the good)

### Nix-Shell
In my opinion one of the most useful features, there are several ways to install software, the main ones being through editing your configuration.nix file then running a rebuild (no downtime, quick and easy). You can also do it through nix shell, you do 'nix-shell -p software-name' then you can launch and use the software from that shell but once you exit the shell (or reboot) the software is gone. Think of how many things you install to use once then have bloating up your system till the end of time.

The second way I use nix-shell is with a shell.nix file, you make this in a code directory inside it you specify what software you want an example of the one for this blog can be found below[^4]

[^4]: Screenshot made with silicon, the nix-shell was made before I'd install git system wide so that line could now be trimmed.

![nixshell](/assets/images/nixshell.png)

I do not want ruby and bundler installed system wide just so that I can use them in one folder, I do similar things with python code. I have python system wide but I use specific plugins and versions in specific projects, this way I don't run into the common problem of python causing issues over time. I have python3 system wide, any lib or python2 code gets a shell.nix and once I cd into that directory I just run 'nix-shell' then I have all the libraries and languages I need.

### Atomic Rollbacks
You update a piece of software and it breaks. You update your OS and something breaks. You update all your software and something breaks. You need to start work in 10 minutes but now you're having to troubleshoot what broke and why, times running out. You're now googling "slack 2.1.6 download" and hoping you can get an older installer in time. 

On nixos you can just revert to a previous generation by running 'sudo nixos-rebuild switch --rollback' thats it. All the previous updates are rolled back to whatever they where before your previous update command, all your files remain intact, lets say your system breaks so much that you can't even load the OS - at boot you can just pick a previous generation to rollback to, that it *minimal downtime*

## The Bad
Like anyone else who's used nixos the only bad thing I can name is the wiki, it's just bad. Most of the time I had to resort to a mixture of the wiki and claude[^5] a few times it even got so bad I had to resort to running claude code as root then telling it what needs to be fixed, how to test if it's fixed, allowing all edits then going on a walk and hoping I don't come back to a paperweight. 

This normally would be a minor issue but on a complex system it becomes grating, NixOS tutorials always seem to assume you understand the system as well. They'll tell you that you can use flakes of home-manager but not if you can use a mixture, or if you can move from one to another at a later date, or even the pros/cons of each. 

[^5]: My AI tool of choice

## The ugly
I'm reluctant to say ugly but I feel like some osrt of interactive game (web browser based) teaching you the basics of nixOS i.e flakes, home-manager, how it works - would go a long way. 

# Will I stick with NixOS?
I have daily driven (in terms of linux distros) Ubuntu, Fedora, Arch, Manjaro, QubesOS. If we're including distros I've daily driven for between 1 week and 1 year the list expands to include gentoo, tails, crashbang(?) hashbang(?) or maybe !#(?) an arch based old distro, subgraph and omarchy (to test im not personally a fan) - I feel confident in saying the odds I will ever daily drive something other than NixOS are incredibly slim - with every other distro they felt like stepping stones, with nixos it feels like the endgame.

I think the vision of nix and my understanding of it (though limited) is that it's a very intentional and thoughtful system designed following what is in my opinion the best software design principle *stay out of the users way*.
