# Engine eval: 30 moods

Run by `npm run eval` from Phase 3 onward, and after every prompt, schema or catalogue change. Results go to `docs/eval/<date>.md`.

## How each mood is judged

Rule checks (automatic, must all pass):
- Hard constraints respected: languages, platforms, runtime or format, hard no's, family watchability when company is family or kids.
- 3 distinct titles, all present in the card store (nothing recommended from model memory).
- Every "why this fits" line refers to something the user actually said.

Fit check (an LLM judge, then Claude Code reads the worst five itself):
- Would a thoughtful friend who knows these titles make these picks for this mood? Score 1–5.

**Pass bar before Checkpoint 2:** all rule checks pass on at least 28 of 30, and average fit ≥ 4.0 with no mood below 3.

## Default saved preferences for the eval

Languages: Hindi, English. Platforms: Netflix, Prime Video, JioHotstar. Unless a mood says otherwise.

## The moods

1. Rough day at work, want something warm but not dumb.
2. Need to cry but in a good way.
3. Something my parents and I can all watch after dinner.
4. Mindless but not stupid.
5. dil toot gaya yaar, kuch cathartic chahiye
6. I'm bored and want to be on the edge of my seat.
7. Feeling lonely tonight, want something comforting.
8. Date night, nothing too heavy, nothing cringe.
9. Friends are over, we want to laugh loudly.
10. I want something to half-watch while I eat.
11. Anxious already, please nothing tense.
12. Want a series to binge this weekend, something gripping.
13. A short movie, under 100 minutes, I'm sleepy.
14. Something like Dil Chahta Hai but newer.
15. I want to feel hopeful about people again.
16. Scary but not gory.
17. Tamil or Malayalam film, I'm fine with subtitles, something brilliant.
18. Watching with my 10-year-old, something we'll both enjoy.
19. I want a true story that's actually true.
20. Nostalgic 90s vibe.
21. Something that makes me think for days.
22. I want to feel the sadness, not escape it.
23. Heist or con movie, clever, fun.
24. Just had a breakup, absolutely no romance.
25. Something beautiful to look at, slow is fine.
26. I have 30 minutes, give me an episode of something.
27. Motivated, want to feel like I can do anything.
28. Rainy evening, chai, something cosy.
29. Surprise me (no other input).
30. kuch bhi light, bas sad ending mat dena
