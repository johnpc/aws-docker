# What is this repo:

This repo contains AWS cdk scripts to deploy a docker container that runs in AWS Fargate.

## Prerequisites

1.  Install the AWS sdk

```
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
```

3.  Set up your .env file with contents like this:

```
SERVICE_NAME=FargateService
```

4.  Install dependencies `npm install`

5.  Set it up with `aws configure`

## Okay, I'm ready to run it!

- To deploy infrastructure, run `./deploy.sh`
