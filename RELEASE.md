# Release Process

This document describes how to create and publish a new release of DateStamp.

## Prerequisites

- You must be on the `main` branch
- Your working directory must be clean (no uncommitted changes)
- You need push access to the repository

## Creating a Release

### Using the Release Script (Recommended)

```bash
# For a patch release (1.1.0 -> 1.1.1)
./scripts/release.sh patch

# For a minor release (1.1.0 -> 1.2.0)
./scripts/release.sh minor

# For a major release (1.1.0 -> 2.0.0)
./scripts/release.sh major
```

The script will:
1. Verify you're on the main branch
2. Check for uncommitted changes
3. Pull latest changes
4. Bump the version in package.json
5. Create a git commit and tag
6. Push to GitHub

### Manual Release

If you prefer to create a release manually:

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull

# 2. Bump version (choose one)
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes

# 3. Push changes and tag
git push origin main
git push origin --tags
```

## After Creating a Release

Once you push the version tag, GitHub Actions will automatically:

1. Build the application for Linux (AppImage)
2. Create a GitHub Release
3. Upload the AppImage and update metadata
4. Make the update available to existing installations

## Monitoring the Release

1. Go to the [Actions tab](https://github.com/ghostsxxx/datestamp/actions) on GitHub
2. Watch the "Build and Release" workflow
3. Once complete, check the [Releases page](https://github.com/ghostsxxx/datestamp/releases)

## Auto-Update Flow

Users with existing installations will:
1. Automatically check for updates hourly
2. Download updates in the background
3. Be notified when an update is ready
4. Can manually check for updates in Settings
5. Apply the update on next restart

## Troubleshooting

### Build Fails

- Check the GitHub Actions logs for errors
- Ensure all dependencies are properly listed in package.json
- Verify the build works locally with `npm run package`

### Auto-Update Not Working

- Verify the GitHub repository is public
- Check that electron-updater is configured correctly
- Ensure the publish configuration in package.json is correct
- Check application logs for update errors

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: New functionality (backwards compatible)
- **PATCH** version: Bug fixes (backwards compatible)