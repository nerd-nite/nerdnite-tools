#!/usr/bin/env perl
use strict;
use warnings;
use NerdNite::Email;

use JSON;
use Carp;
use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Readonly;
use Data::Dumper;
use Underscore;
use Log::Log4perl;


Readonly my $DEFAULT_QUOTA => 250;

Log::Log4perl::init('./perlLogging.conf');

my $logger = Log::Log4perl->get_logger('com.nerdnite.tools.create_boss');

my $boss_name = shift || croak "Please provide a boss name: foo -> foo\@nerdnite.com\n";
my $external  = shift || croak "Please provide an external email address\n";
my $skipCheck = shift || 0;

if($skipCheck) {
    print STDERR "Skipping the check for pre-existing email address\n";
}

my $emailChecker = NerdNite::Email->new();
my $currentEmails = $skipCheck ? [] : $emailChecker->getAllEmails();


if(_->contains($currentEmails, "$boss_name\@nerdnite.com")) {
    print "$boss_name\@nerdnite.com already exists in the system";
    exit 1;
}
else {
    create_email($boss_name, [$external]);
}




sub create_email {
	my $nn_email        = shift;
	my $external_emails = shift;

	$logger->info("Creating email for $nn_email");

	my $message = '';
	my @notifees;

	create_forwarders( $nn_email, $external_emails );
	
	@notifees = ("$nn_email\@nerdnite.com");
	$message = <<"END_OF_MESSAGE";			
Hello,

We have just created (or updated) a forwarder from $nn_email\@nerdnite.com to this email address.

You don't have to do anything; just know that emails to your Nerd Nite address will now arrive here. If you do spam filtering, you may need to set up
a whitelist to let these emails through.

If you'd like to switch to a dedicated mailbox, just email me at dan\@nerdnite.com and I can switch things over for you.

Thanks,

Dan
END_OF_MESSAGE
	
	print STDERR "Sending emails to @notifees\n";
	foreach my $external_email (@notifees) {
		my $transport = Email::Sender::Transport::SMTP->new({
			host		=> 'smtp.gmail.com',
			port 		=> 465,
			ssl		=> 1,
			sasl_username	=> 'nn.dan.rumney@gmail.com',
			sasl_password	=> 's4tgd1tw',		
		});
  		my $email = Email::Simple->create(
  			header 	=> [
			 	To	=> $external_email,
			 	From	=> 'dan@nerdnite.com',
			 	Subject	=> 'New Nerd Nite Mailbox',
			 ],
			 body	=> $message,
			);
			sendmail($email, { transport => $transport}) or croak  "Mail fail";
	}
}

sub create_forwarders {
	my $email   = shift;
	my $targets = shift;
	my $nnEmail = NerdNite::Email->new();

	my $params = {
		domain => 'nerdnite.com',
		email  => $email,
		fwdopt =>'fwd'
	};

	foreach my $target ( @{$targets} ) {
		$params->{fwdemail} = $target;
		$logger->info("Creating forward from $email to $target");
		my $result = $nnEmail->addForward( $email => $target );
		print STDERR Dumper($result);
	}
}