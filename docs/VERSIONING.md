# Versioning System

This extension implements an automatic versioning system that follows a predictable numeric progression. 
The goal is to ensure consistency, easy tracking of changes, and seamless updates without manually managing version numbers.

## Version Sequence

All versions follow the standard semantic-like pattern:
```
MAJOR.MINOR.PATCH
```

However, instead of traditional semantic versioning (SemVer), 
this system uses a custom incremental sequence designed for smoother iteration during development and deployment.

The version progresses in a sequential manner as follows:

```
0.0.1 → 0.1.0 → 0.1.1 → 0.2.0 → 0.2.1 → 0.2.2 → 0.3.0 → 0.3.1 → 0.3.2 → 0.3.3 → 0.4.0 → ...
```
Each minor and patch increment occurs automatically based on the rules below.

## Version Increment Logic

The increment logic determines the next version number automatically depending on the relationship between the minor and patch values:

1. If patch < minor → Increment the patch number.
2. If patch == minor → The version is considered stable. Increment the minor number and reset the patch to 0.

This approach ensures stability milestones occur predictably as development progresses.

### Examples

| Current Version | Next Version | Description                              |
| --------------- | ------------ | ---------------------------------------- |
| 0.2.0           | 0.2.1        | Increment patch                          |
| 0.2.1           | 0.2.2        | Increment patch (reaches stability)      |
| 0.2.2           | 0.3.0        | Stable version reached → increment minor |
| 0.3.0           | 0.3.1        | Increment patch                          |
| 0.3.1           | 0.3.2        | Increment patch                          |
| 0.3.2           | 0.3.3        | Increment patch (reaches stability)      |
| 0.3.3           | 0.4.0        | Stable version reached → increment minor |

 ## ✅ Stable Versions

A version is marked stable when the minor and patch numbers are equal.
These serve as reliable checkpoints in development and are good candidates for public release.

*Examples of stable versions:*

```
0.0.1, 0.1.1, 0.2.2, 0.3.3, 0.4.4, 0.9.9, 1.1.1, 2.2.2, ...
```

## Notes

> [!TIP]<br>
> - The major version remains constant (e.g., 0.x.x) until significant architectural or backward-incompatible changes occur.<br>
> - Once stability reaches a point where the project is production-ready, the version can transition to 1.0.0.<br>
> - This versioning system is ideal for iterative extensions where progress is steady and stability markers are important.
