
Pod::Spec.new do |s|
  s.name         = "RNBridgefy"
  s.version      = "2.0.0"
  s.summary      = "Bridgefy SDK"
  s.description  = <<-DESC
                  Bridgefy SDK wrapper
                   DESC
  s.homepage      = "https://bridgefy.me"
  s.license       = "MIT"
  # s.license     = { :type => "MIT", :file => "FILE_LICENSE" }
  s.author        = { "Bridgefy" => "contact@bridgefy.me" }
  s.platform      = :ios, "11.0"
  s.source        = { :git => "https://bitbucket.org/bridgefy/react-native-bridgefy-sdk", :tag => "master" }
  s.source_files  = "**/*.{h,m}"
  s.requires_arc = true

  # s.vendored_frameworks = 'BFTransmitter.framework'
  s.dependency 'BFTransmitter', '~> 2.0.0'
  s.dependency 'React'
end

