# The data API's Express gateway, from `describe-express-gateway-service` (endpoint) and `describe-listeners` on the
# load balancer ECS created for it; data-api.dbie.rbihub.in points at the endpoint and our certificate joins the listener.
api_gateway_dns_name     = "da-9a220423d40d4f1896457f6dd2675b48.ecs.ap-south-1.on.aws"
api_gateway_listener_arn = "arn:aws:elasticloadbalancing:ap-south-1:588387717844:listener/app/ecs-express-gateway-alb-6583594e/2a6abe25f0630992/180cae9cb8614d7e"
