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
my $type      = shift || '';
my $skipCheck = shift || 0;

if($type eq "M") {
	$type = 'mailbox';
} elsif ($type eq 'F') {
	$type = 'forwarder';
} else {
	croak "Unknown type: $type\n";
}

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
    create_email($boss_name, $type, [$external]);
}




sub create_email {
	my $nn_email        = shift;
	my $email_type      = shift;
	my $external_emails = shift;

	$logger->info("Creating email for $nn_email");
	$logger->info("This will be a $email_type");

	my $message = '';
	my @notifees;

	if ( $email_type eq 'forwarder' ) {
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
	}
	elsif ( $email_type eq 'mailbox' ) {
		my $password = create_mailbox($nn_email);
		# Send an email to the external address with username and password details.
		@notifees = @{$external_emails};
		$message = <<"END_OF_MESSAGE";			
Hello,

We have just created a mailbox for $nn_email\@nerdnite.com. Your login details are below.

You can access this mailbox via the web at http://nerdnite.com/webmail
Username: $nn_email+nerdnite.com
Password: $password

If you want, you can set up your favourite email client (like Thunderbird or Outlook) with the following information:


Incoming Mail Server: 	(SSL) server.lizziebracken.com
Outgoing Mail Server: 	(SSL) server.lizziebracken.com (server requires authentication) port 465
Incoming: 				POP3S (SSL/TLS), IMAPS (SSL/TLS)
Outgoing:				SMTPS (SSL/TLS)

If you have any questions, email me at dan\@nerdnite.com

Dan
END_OF_MESSAGE
	
	}
	else {
		carp "Failed to create account for $nn_email\@nerdnite.com\n";
	}
	print STDERR "Sending emails to @notifees\n";
	foreach my $external_email (@notifees) {
		my $transport = Email::Sender::Transport::SMTP->new({
    		host	=> 'lizziebracken.com',
    		port 	=> 465,
    		ssl		=> 1,
    		sasl_username	=> 'dan+nerdnite.com',
    		sasl_password	=> 's4tgd1tw',
    		
  		});
  		my $email = Email::Simple->create(
  			header 	=> [
			 	To		=> $external_email,
			 	From	=> 'dan@nerdnite.com',
			 	Subject	=> 'New Nerd Nite Mailbox',
			 ],
			 body	=> $message,
			);
			sendmail($email, { transport => $transport}) or croak  "Mail fail";
		}
}

sub create_mailbox {
	my $email    = shift;
	my $password = create_random_password();
	my $nnEmail = NerdNite::Email->new();

	my $params = {
		domain   => 'nerdnite.com',
		email    => $email,
		password => $password,
		quota    => $DEFAULT_QUOTA
	};
	my $result = $nnEmail->request( 'addpop', $params );
	print STDERR Dumper($result);
	
	return $password;
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

srand;

sub create_random_password {
	my @password_symbols = ( 0 .. 9, 'a' .. 'z' );
	my $length = shift || 8;
	my $password = '';
	foreach my $sym_num (0..$length) {
		$password .= $password_symbols[ rand @password_symbols ];
	}

	return $password;
}

