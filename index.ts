import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require("@aws-cdk/aws-ecs");
import ecs_patterns = require("@aws-cdk/aws-ecs-patterns");
import cdk = require("@aws-cdk/core");
import route53 = require("@aws-cdk/aws-route53");
import acm = require("@aws-cdk/aws-certificatemanager");
import targets = require("@aws-cdk/aws-route53-targets/lib");
import path = require("path");
import { config } from "dotenv";

config();
if (!process.env.SERVICE_NAME) {
  throw new Error("process.env.SERVICE_NAME not specified. Update .env");
}
if (!process.env.DOMAIN_NAME) throw new Error("Missing DOMAIN_NAME in .env");
if (!process.env.SUBDOMAIN) throw new Error("Missing DOMAIN_NAME in .env");

const app = new cdk.App();
const stack = new cdk.Stack(app, process.env.SERVICE_NAME);
const vpc = new ec2.Vpc(
  stack,
  process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "Vpc",
  { maxAzs: 2 }
);
const cluster = new ecs.Cluster(stack, "Cluster", { vpc });
const lb = new ecs_patterns.ApplicationLoadBalancedFargateService(
  stack,
  process.env.SERVICE_NAME,
  {
    assignPublicIp: true,
    cluster,
    taskImageOptions: {
      image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, "docker"))
    }
  }
);

let zone;
try {
  zone = route53.HostedZone.fromLookup(
    stack,
    process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "HostedZone",
    {
      domainName: process.env.DOMAIN_NAME
    }
  );
} catch (err) {
  zone = new route53.PublicHostedZone(
    stack,
    process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "HostedZone",
    {
      zoneName: process.env.DOMAIN_NAME
    }
  );
}

const siteDomain = process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME;
new cdk.CfnOutput(stack, "Site", { value: "https://" + siteDomain });

// TLS certificate

const certificateArn = new acm.DnsValidatedCertificate(
  stack,
  process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "SiteCertificate",
  {
    domainName: siteDomain,
    hostedZone: zone
  }
).certificateArn;
new cdk.CfnOutput(
  stack,
  process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "Certificate",
  { value: certificateArn }
);

// Route53 alias record for the CloudFront distribution
new route53.ARecord(
  stack,
  process.env.SUBDOMAIN + "." + process.env.DOMAIN_NAME + "SiteAliasRecord",
  {
    recordName: siteDomain,
    target: route53.AddressRecordTarget.fromAlias(
      new targets.LoadBalancerTarget(lb.loadBalancer)
    ),
    zone
  }
);

app.synth();
