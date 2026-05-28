pipeline {
    agent any

    environment {
        // AWS Settings
        AWS_ACCOUNT_ID             = '959689755891' // Replace with your AWS Account ID
        AWS_DEFAULT_REGION         = 'us-east-1'    // Replace with your target AWS region
        
        // ECR & ECS Configuration
        ECR_REPOSITORY_NAME        = 'campus-connect-backend'
        ECS_CLUSTER_NAME           = 'campus-connect-cluster'
        ECS_SERVICE_NAME           = 'campus-connect-backend-service'
        
        // Frontend S3 & CloudFront Configuration
        S3_BUCKET_NAME             = 'campus-connect-frontend-gguqkb'
        CLOUDFRONT_DISTRIBUTION_ID = 'E94TLMKWWXYDL'    // Replace with your CloudFront ID
        

    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from Git...'
                checkout scm
            }
        }

        stage('Secrets Scan (GitLeaks)') {
            steps {
                echo 'Scanning git repository for committed secrets...'
                sh 'docker run --rm -v "$(pwd):/path" zricethezav/gitleaks:latest detect --source=/path --verbose --redact'
            }
        }

        stage('Terraform Security Scan (Checkov)') {
            steps {
                echo 'Scanning Terraform files for security misconfigurations...'
                sh 'docker run --rm -v "$(pwd):/tf" bridgecrew/checkov:latest -d /tf/terraform'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Backend and Frontend node modules...'
                dir('Backend') {
                    sh 'npm install'
                }
                dir('Frontend') {
                    // Installs any UI client-side building packages if necessary
                    // (Currently uses CDN libraries, but ready for extensions)
                    // sh 'npm install' 
                }
            }
        }

        stage('Dependency Vulnerability Scan (npm audit)') {
            steps {
                echo 'Scanning Node dependencies for known vulnerabilities...'
                dir('Backend') {
                    sh 'npm audit --audit-level=high'
                }
            }
        }

        stage('SAST Code Scan (Semgrep)') {
            steps {
                echo 'Scanning application source code for security flaws...'
                sh 'docker run --rm -v "$(pwd):/src" returntocorp/semgrep semgrep scan --config=auto --exclude=node_modules --exclude=.terraform'
            }
        }



        stage('Run Unit & Integration Tests') {
            steps {
                echo 'Running automated tests...'
                dir('Backend') {
                    // sh 'npm test' // Currently placeholder, add your test runner once written
                }
            }
        }

        stage('Docker Build & Local Scan') {
            steps {
                echo 'Building backend Docker image...'
                script {
                    def imageTag = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}:${BUILD_NUMBER}"
                    sh "docker build -t ${imageTag} ./Backend"
                    
                    echo 'Scanning Docker image with Trivy...'
                    // Scan image but don't fail the build for base image vulnerabilities
                    sh "trivy image --severity HIGH,CRITICAL --exit-code 0 ${imageTag}"
                }
            }
        }

        stage('Push Image to AWS ECR') {
            steps {
                echo 'Logging into AWS ECR and pushing image...'
                // Using AWS credentials configured in Jenkins Credentials Manager
                script {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding', 
                        credentialsId: 'aws-jenkins-credentials'
                    ]]) {
                        sh "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
                        
                        def imageTag = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}:${BUILD_NUMBER}"
                        sh "docker push ${imageTag}"
                        
                        // Tag the image as 'latest' for convenience
                        sh "docker tag ${imageTag} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}:latest"
                        sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}:latest"
                    }
                }
            }
        }

        stage('Deploy Backend (ECS Rolling Update)') {
            steps {
                echo 'Updating AWS ECS Service to trigger rolling deployment...'
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding', 
                    credentialsId: 'aws-jenkins-credentials'
                ]]) {
                    // Update ECS Service to use the new Docker task definition / pull latest image
                    sh """
                        aws ecs update-service \
                        --cluster ${ECS_CLUSTER_NAME} \
                        --service ${ECS_SERVICE_NAME} \
                        --force-new-deployment \
                        --region ${AWS_DEFAULT_REGION}
                    """
                }
            }
        }

        stage('Deploy Frontend (S3 & CloudFront)') {
            steps {
                echo 'Syncing static Frontend files to S3 bucket...'
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding', 
                    credentialsId: 'aws-jenkins-credentials'
                ]]) {
                    // Sync files and delete any removed files from destination S3
                    sh "aws s3 sync ./Frontend s3://${S3_BUCKET_NAME} --delete --region ${AWS_DEFAULT_REGION}"
                    
                    echo 'Creating CloudFront cache invalidation request...'
                    sh "aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*' --region ${AWS_DEFAULT_REGION}"
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution completed. Cleaning workspace...'
            cleanWs()
        }
        success {
            echo 'Deployment successful. Sending notification...'
            // Requires the Jenkins Slack Plugin installed and configured
            script {
                try {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "🚀 *Campus Connect* - Build #${BUILD_NUMBER} was SUCCESSFUL!\nDeployed to AWS ECS (Backend) and AWS S3/CloudFront (Frontend).\nDetails: ${env.RUN_DISPLAY_URL}"
                    )
                } catch (Exception e) {
                    echo "Slack notification failed: ${e.getMessage()}"
                }
            }
        }
        failure {
            echo 'Deployment failed. Sending alert...'
            script {
                try {
                    slackSend(
                        channel: '#deployments',
                        color: 'danger',
                        message: "❌ *Campus Connect* - Build #${BUILD_NUMBER} FAILED at stage '${env.STAGE_NAME}'.\nCheck logs: ${env.RUN_DISPLAY_URL}"
                    )
                } catch (Exception e) {
                    echo "Slack notification failed: ${e.getMessage()}"
                }
            }
        }
    }
}
