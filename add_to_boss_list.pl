#!/usr/bin/env perl
use strict;
use warnings;
use cPanel::PublicAPI;
use JSON;
use Carp;
use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Readonly;
use Data::Dumper;
use feature 'state';

Readonly my $DEFAULT_QUOTA => 250;

my @bosses = map { "$_\@nerdnite.com" } @ARGV;
print Dumper(\@bosses);

my $type = "";


create_forwarders('bosses', \@bosses);



sub create_forwarders {
	my $email   = shift;
	my $targets = shift;

	my $params = {
		domain => 'nerdnite.com',
		email  => $email,
	};
	$params->{fwdopt} = 'fwd';

	foreach my $target ( @{$targets} ) {
		$params->{fwdemail} = $target;
		my $result = send_cpanel_request( 'Email', 'addforward', $params );
		print STDERR Dumper($result);
	}
}

sub send_cpanel_request {
	state $cp = cPanel::PublicAPI->new(
		'user'   => 'nerdnite',
		'pass'   => 's4tgd1tw',
		'host'   => 'lizziebracken.com',
		'usessl' => 1,
		'debug'		=> 1,
	) || croak "Could not create cPanel connection: $!";
	state $json = JSON->new->allow_nonref;

	my $module   = shift;
	my $function = shift;
	my $params   = shift;

	my $result = $cp->cpanel_api2_request(
		'cpanel',
		{
			'module' => $module,
			'func'   => $function,
		},
		$params, 'json'
	);
	print STDERR Dumper($result);
	return $json->decode($result)->{cpanelresult};
}
