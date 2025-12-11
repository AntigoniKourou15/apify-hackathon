## Playwright test template

<!-- This is an Apify template readme -->

Run your Playwright tests on the Apify platform effectively and easily. Just set up your test environment using a user-friendly UI and let the platform do the rest.

> Note: This is a custom version of Playwright Test Runner Actor. Unlike the original Actor, this version reads test suite files from the tests folder and does not allow you to pass the test files via Apify input.

## Features

### Run your Playwright tests on the Apify platform

No more pre-commit hooks or CI/CD pipelines. Integrate your tests with the Apify Platform using a user-friendly UI and forget about the hassle of setting up your test environment.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/actorInput.gif" alt="Test configuration with comprehensive UI">
</center>

### Collect and analyze your test results online

After running the tests, the Apify platform stores the results in comprehensive datasets. You can view the results directly on the platform or download them to your local machine using a REST API.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/testReport.gif" alt="Analyzing understandable test reports">
</center>

### No more problems with incompatible browser versions

Playwright Test toolkit automatically downloads the latest versions of Chromium, Firefox, and WebKit browsers and installs them in the Apify platform.

This way, you can test your websites using all the popular browsers without worrying about compatibility issues.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/devices.gif" alt="Testing with multiple browser versions at once">
</center>

## How to use

Just provide your test suite files in the `tests` folder and run the Actor. The Actor will automatically run all the tests in the `tests` folder and store the results in the KVS/dataset fields.

You can also customize the test run by specifying other options in the input, e.g. the screen size, headful/headless execution or the maximum run time.

### Test Generator

You can also use the Playwright Codegen to compose your test suites even faster. Just run `npm run codegen` in your project folder and record your workflow.

The code generator will automatically create a test suite file for you and save it in the `tests` folder.

## Resources

- Original [Playwright Test Runner](https://apify.com/jindrich.bar/playwright-test) Actor
- [Playwright testing: how to write and run E2E tests properly](https://blog.apify.com/playwright-testing-how-to-write-and-run-e2e-tests-properly/)
- [Video guide on getting scraped data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)
- [Integration with Make](https://apify.com/integrations), GitHub, Zapier, Google Drive, and other apps
- Video tutorial on how to run end-to-end Playwright tests
- A short guide on [how to build web scrapers using code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)

[Video tutorial on how to run end-to-end Playwright tests](https://www.youtube.com/watch?v=V5DEx5x7I0w)


## Getting started

For complete information [see this article](https://docs.apify.com/platform/actors/development#build-actor-locally). To run the Actor use the following command:

```bash
apify run
```

## Deploy to Apify

### Connect Git repository to Apify

If you've created a Git repository for the project, you can easily connect to Apify:

1. Go to [Actor creation page](https://console.apify.com/actors/new)
2. Click on **Link Git Repository** button

### Push project on your local machine to Apify

You can also deploy the project on your local machine to Apify without the need for the Git repository.

1. Log in to Apify. You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

    ```bash
    apify login
    ```

2. Deploy your Actor. This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

    ```bash
    apify push
    ```

## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)
