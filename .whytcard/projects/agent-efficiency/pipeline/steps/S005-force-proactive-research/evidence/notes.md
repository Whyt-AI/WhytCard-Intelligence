# Notes

- The main behavior change is intentional: the prompt-dispatch hook now injects proactive context gates even for neutral prompts.
- The stop hooks now treat unsupported first-plausible-answer behavior as a blocking protocol failure when the task depended on broad reading, research, or diagnosis.
- The core docs now frame usefulness as proactive evidence gathering and maximum justified knowledge, not verbosity or endless searching.
